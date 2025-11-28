import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// 1. OBTENER TODOS LOS PEDIDOS
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.idPedido,
                CONCAT(u.nombre, ' ', u.apellido) as nombreCliente,
                u.correoElectronico as correo,
                p.telefonoContacto as telefono,
                CONCAT(d.linea1, ', ', d.ciudad) as direccion,
                p.total,
                p.fechaPedido,
                ep.nombreEstado as estado,
                -- Subconsulta para traer los productos como JSON
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'nombre', dp.nombreProducto,
                            'cantidad', dp.cantidad,
                            'precio', dp.precioUnitario
                        )
                    )
                    FROM DetallePedido dp
                    WHERE dp.idPedido = p.idPedido
                ) as productos
            FROM Pedido p
            LEFT JOIN Usuario u ON p.idUsuario = u.idUsuario
            LEFT JOIN Direccion d ON p.idDireccion = d.idDireccion
            LEFT JOIN EstadoPedido ep ON p.idEstadoPedido = ep.idEstadoPedido
            ORDER BY p.fechaPedido DESC
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los pedidos' });
    }
});

// 2. CANCELAR PEDIDO (Y ELIMINAR ENVÍO)
router.put('/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // A. Cambiar estado a 'Cancelado' (Asumiendo ID 5 es Cancelado)
        await connection.query('UPDATE Pedido SET idEstadoPedido = 5 WHERE idPedido = ?', [id]);

        // B. Eliminar el envío asociado si existe (Requisito clave)
        await connection.query('DELETE FROM Envio WHERE idPedido = ?', [id]);

        // C. Opcional: Devolver stock (Si quisieras implementar lógica de retorno)
        // ...

        await connection.commit();
        res.json({ message: 'Pedido cancelado y envío eliminado.' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error al cancelar el pedido' });
    } finally {
        connection.release();
    }
});

// 3. ELIMINAR REGISTRO (Solo para limpieza)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Pedido WHERE idPedido = ?', [id]);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar' });
    }
});

export default router;