import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// 1. OBTENER CATÁLOGO PÚBLICO
router.get('/products', async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.nombre as categoriaNombre 
            FROM Producto p
            JOIN Categoria c ON p.idCategoria = c.idCategoria
            WHERE p.idEstadoProducto = 1 AND p.stock > 0
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar catálogo' });
    }
});

// 2. OBTENER MÉTODOS DE ENVÍO
router.get('/shipping-methods', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM MetodoEnvio');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar métodos de envío' });
    }
});

// 3. CHECKOUT (Crear Pedido Pendiente) - ACTUALIZADO CON NOMBRE Y CORREO
router.post('/checkout', async (req, res) => {
    const { idUsuario, idDireccion, idMetodoEnvio, telefonoContacto, correoContacto, nombreContacto, carrito } = req.body;

    if (!carrito || carrito.length === 0) return res.status(400).json({ message: 'El carrito está vacío' });

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [envioData] = await connection.query('SELECT costo FROM MetodoEnvio WHERE idMetodoEnvio = ?', [idMetodoEnvio]);
        if (envioData.length === 0) throw new Error('Método de envío inválido');
        const costoEnvio = parseFloat(envioData[0].costo);

        let subtotal = 0;
        carrito.forEach(item => subtotal += parseFloat(item.precio) * parseInt(item.cantidad));
        const total = subtotal + costoEnvio;

        // INSERTAR PEDIDO CON NUEVOS CAMPOS
        const [pedidoResult] = await connection.query(`
            INSERT INTO Pedido 
            (idUsuario, idDireccion, idMetodoEnvio, idEstadoPedido, telefonoContacto, correoContacto, nombreContacto, subtotal, costoEnvio, total)
            VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
        `, [idUsuario, idDireccion, idMetodoEnvio, telefonoContacto, correoContacto, nombreContacto, subtotal, costoEnvio, total]);

        const idPedido = pedidoResult.insertId;

        // Insertar Detalles y Restar Stock
        for (const item of carrito) {
            await connection.query(`
                INSERT INTO DetallePedido (idPedido, idProducto, nombreProducto, cantidad, precioUnitario, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [idPedido, item.idProducto, item.nombre, item.cantidad, item.precio, (item.precio * item.cantidad)]);

            await connection.query('UPDATE Producto SET stock = stock - ? WHERE idProducto = ?', [item.cantidad, item.idProducto]);
        }

        await connection.commit();
        res.json({ message: 'Pedido creado exitosamente', idPedido: idPedido });

    } catch (error) {
        await connection.rollback();
        console.error("Error en checkout:", error);
        res.status(500).json({ message: 'Error al procesar la compra', error: error.message });
    } finally {
        connection.release();
    }
});

// 4. OBTENER PEDIDO POR ID
router.get('/orders/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT p.*, me.nombre as metodoEnvio, me.tiempoEstimado, p.idEstadoPedido
            FROM Pedido p
            JOIN MetodoEnvio me ON p.idMetodoEnvio = me.idMetodoEnvio
            WHERE p.idPedido = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });

        const [detalles] = await pool.query('SELECT * FROM DetallePedido WHERE idPedido = ?', [id]);
        const pedido = rows[0];
        pedido.items = detalles;

        res.json(pedido);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar pedido' });
    }
});

// 5. PAGAR PEDIDO
router.post('/pay', async (req, res) => {
    const { idPedido, metodoPago } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [pedidoCheck] = await connection.query('SELECT idEstadoPedido, total, idMetodoEnvio FROM Pedido WHERE idPedido = ?', [idPedido]);
        if (pedidoCheck.length === 0) throw new Error('Pedido no encontrado');
        if (pedidoCheck[0].idEstadoPedido !== 1) throw new Error('El pedido ya no está pendiente');

        const { total, idMetodoEnvio } = pedidoCheck[0];

        await connection.query('UPDATE Pedido SET idEstadoPedido = 2 WHERE idPedido = ?', [idPedido]);

        const idMetodoPago = metodoPago === 'Tarjeta' ? 1 : 2;
        await connection.query(`
            INSERT INTO Pago (idPedido, idMetodoPago, monto, estado, referenciaTransaccion)
            VALUES (?, ?, ?, 'Completado', ?)
        `, [idPedido, idMetodoPago, total, `TXN-${Date.now()}`]);

        const trackingCode = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        const fechaActual = new Date();
        let diasExtra = 0;
        if (idMetodoEnvio === 3) diasExtra = 3;

        const fechaEstimada = new Date(fechaActual);
        fechaEstimada.setDate(fechaActual.getDate() + diasExtra);

        await connection.query(`
            INSERT INTO Envio (idPedido, codigoSeguimiento, fechaDespacho, fechaEntregaEstimada, estado)
            VALUES (?, ?, NOW(), ?, 'Preparando')
        `, [idPedido, trackingCode, fechaEstimada]);

        await connection.commit();
        res.json({ message: 'Pago exitoso y envío generado', tracking: trackingCode });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error al procesar el pago', error: error.message });
    } finally {
        connection.release();
    }
});

export default router;