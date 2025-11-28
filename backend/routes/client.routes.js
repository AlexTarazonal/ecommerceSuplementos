import { Router } from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const router = Router();

// 1. LISTAR MIS PEDIDOS (Historial completo)
router.get('/orders/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    try {
        const sql = `
            SELECT 
                p.idPedido,
                p.fechaPedido,
                p.total,
                p.telefonoContacto,
                p.correoContacto,
                p.nombreContacto,
                p.idEstadoPedido,
                p.idDireccion, 
                me.nombre as metodoEnvio,
                e.codigoSeguimiento,
                e.estado as estadoEnvio,
                e.fechaEntregaEstimada,
                
                -- CORRECCIÓN AQUÍ: Cambiado alias a 'direccionCompleta' para coincidir con el frontend
                CONCAT(d.linea1, ', ', d.ciudad, ' - ', d.referencia) as direccionCompleta,
                
                d.linea1, d.ciudad, d.codigoPostal, d.referencia, d.alias,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('nombre', dp.nombreProducto, 'cantidad', dp.cantidad, 'precio', dp.precioUnitario)
                    )
                    FROM DetallePedido dp WHERE dp.idPedido = p.idPedido
                ) as items
            FROM Pedido p
            LEFT JOIN MetodoEnvio me ON p.idMetodoEnvio = me.idMetodoEnvio
            LEFT JOIN Envio e ON p.idPedido = e.idPedido
            LEFT JOIN Direccion d ON p.idDireccion = d.idDireccion
            LEFT JOIN EstadoPedido ep ON p.idEstadoPedido = ep.idEstadoPedido
            WHERE p.idUsuario = ?
            ORDER BY p.fechaPedido DESC
        `;
        const [rows] = await pool.query(sql, [idUsuario]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar historial' });
    }
});

// 2. EDITAR DATOS DEL PEDIDO (Solo si está en 'Preparando')
router.put('/order/:idPedido', async (req, res) => {
    const { idPedido } = req.params;
    const { nombre, telefono, correo, idDireccion, direccionData } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // A. SEGURIDAD: Verificar estado del envío
        const [envio] = await connection.query('SELECT estado FROM Envio WHERE idPedido = ?', [idPedido]);

        if (envio.length > 0 && envio[0].estado !== 'Preparando') {
            throw new Error('El pedido ya está en camino o entregado. No se pueden modificar los datos.');
        }

        // B. Actualizar Datos de Contacto en PEDIDO
        await connection.query(
            'UPDATE Pedido SET nombreContacto = ?, telefonoContacto = ?, correoContacto = ? WHERE idPedido = ?',
            [nombre, telefono, correo, idPedido]
        );

        // C. Actualizar Dirección
        if (idDireccion && direccionData) {
            await connection.query(
                'UPDATE Direccion SET linea1 = ?, ciudad = ?, codigoPostal = ?, referencia = ? WHERE idDireccion = ?',
                [direccionData.linea1, direccionData.ciudad, direccionData.codigoPostal, direccionData.referencia, idDireccion]
            );
        }

        await connection.commit();
        res.json({ message: 'Datos de entrega actualizados correctamente' });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: error.message || 'Error al actualizar' });
    } finally {
        connection.release();
    }
});

// 3. ACTUALIZAR PERFIL DEL CLIENTE
router.put('/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, telefono, email, password } = req.body;

    try {
        let sql = 'UPDATE Usuario SET nombre=?, apellido=?, telefono=?, correoElectronico=?';
        let params = [nombre, apellido, telefono, email];

        // Solo actualizamos contraseña si el usuario envió una nueva
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            sql += ', passwordHash=?';
            params.push(hash);
        }

        sql += ' WHERE idUsuario=?';
        params.push(id);

        await pool.query(sql, params);

        // Devolvemos los datos actualizados (sin el hash) para actualizar el localStorage
        res.json({
            message: 'Perfil actualizado correctamente',
            user: { id, nombre, apellido, telefono, email, rol: 'cliente' } // Ajusta según tu objeto de sesión
        });

    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El correo ya está registrado por otro usuario.' });
        }
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
});

export default router;