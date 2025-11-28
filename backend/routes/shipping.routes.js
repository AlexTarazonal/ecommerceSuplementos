import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// 1. LISTAR TODOS LOS ENVÍOS (Para el Admin)
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                e.idEnvio,
                e.codigoSeguimiento,
                e.fechaDespacho,
                e.fechaEntregaEstimada,
                e.estado as estadoEnvio,
                p.idPedido,
                CONCAT(u.nombre, ' ', u.apellido) as cliente,
                me.nombre as metodoEnvio,
                d.direccionCompleta
            FROM Envio e
            JOIN Pedido p ON e.idPedido = p.idPedido
            JOIN Usuario u ON p.idUsuario = u.idUsuario
            JOIN MetodoEnvio me ON p.idMetodoEnvio = me.idMetodoEnvio
            JOIN (
                SELECT idDireccion, CONCAT(linea1, ', ', ciudad) as direccionCompleta 
                FROM Direccion
            ) d ON p.idDireccion = d.idDireccion
            ORDER BY e.fechaDespacho DESC
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener envíos' });
    }
});

// 2. ACTUALIZAR ESTADO DE ENVÍO (Y SINCRONIZAR PEDIDO)
router.put('/:id', async (req, res) => {
    const { id } = req.params; // idEnvio
    const { nuevoEstado } = req.body; // 'Preparando', 'En Camino', 'Entregado'

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Actualizar tabla Envio
        await connection.query('UPDATE Envio SET estado = ? WHERE idEnvio = ?', [nuevoEstado, id]);

        // 2. Obtener el idPedido asociado a este envío
        const [envioRows] = await connection.query('SELECT idPedido FROM Envio WHERE idEnvio = ?', [id]);

        if (envioRows.length > 0) {
            const idPedido = envioRows[0].idPedido;
            let idEstadoPedido = 2; // Default: Pagado

            // 3. Sincronizar estado del Pedido
            if (nuevoEstado === 'Preparando') idEstadoPedido = 2; // Pagado
            if (nuevoEstado === 'En Camino') idEstadoPedido = 3; // Enviado
            if (nuevoEstado === 'Entregado') idEstadoPedido = 4; // Entregado

            await connection.query('UPDATE Pedido SET idEstadoPedido = ? WHERE idPedido = ?', [idEstadoPedido, idPedido]);
        }

        await connection.commit();
        res.json({ message: 'Estado actualizado correctamente' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar estado' });
    } finally {
        connection.release();
    }
});

export default router;