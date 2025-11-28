import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// OBTENER TODOS LOS PRODUCTOS
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.idProducto as id,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen,
                c.nombre as categoriaNombre,
                ep.nombreEstado as estado
            FROM Producto p
            LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
            LEFT JOIN EstadoProducto ep ON p.idEstadoProducto = ep.idEstadoProducto
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener productos' });
    }
});

// 2. CREAR PRODUCTO (ESTO FALTABA)
router.post('/', async (req, res) => {
    const { nombre, precio, stock, idCategoria, estado, imagen } = req.body;

    // Mapeo simple de estado (Ajusta los IDs según tu tabla EstadoProducto)
    let idEstado = 1; // Por defecto Activo
    if (estado === 'Agotado') idEstado = 3; // Asumiendo 3 es Agotado
    if (estado === 'Inactivo') idEstado = 2; // Asumiendo 2 es Inactivo

    try {
        const [result] = await pool.query(
            'INSERT INTO Producto (nombre, precio, stock, idCategoria, idEstadoProducto, imagen) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, precio, stock, idCategoria, idEstado, imagen]
        );
        res.status(201).json({ id: result.insertId, message: 'Producto creado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear producto' });
    }
});

// ELIMINAR PRODUCTO
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Producto WHERE idProducto = ?', [id]);
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar producto' });
    }
});

// EDITAR PRODUCTO
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock, idCategoria, estado, imagen } = req.body;

    // Mapeo simple de texto a ID para el estado (ajusta según tu DB)
    // Asumimos: 1=Activo, 2=Agotado, 3=Inactivo
    let idEstado = 1;
    if (estado === 'Agotado') idEstado = 2;
    if (estado === 'Inactivo') idEstado = 3;

    try {
        await pool.query(
            'UPDATE Producto SET nombre = ?, precio = ?, stock = ?, idCategoria = ?, idEstadoProducto = ?, imagen = ? WHERE idProducto = ?',
            [nombre, precio, stock, idCategoria, idEstado, imagen, id]
        );
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar producto' });
    }
});

export default router;