import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// OBTENER TODAS LAS CATEGORÍAS
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT idCategoria as id, nombre, descripcion, imagen FROM Categoria');
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener categorías' });
    }
});

// CREAR CATEGORÍA (ESTO FALTABA)
router.post('/', async (req, res) => {
    const { nombre, descripcion, imagen } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO Categoria (nombre, descripcion, imagen) VALUES (?, ?, ?)',
            [nombre, descripcion, imagen]
        );
        res.status(201).json({ id: result.insertId, message: 'Categoría creada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear categoría' });
    }
});

// ELIMINAR CATEGORÍA
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Categoria WHERE idCategoria = ?', [id]);
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar categoría' });
    }
});

// EDITAR CATEGORÍA
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, imagen } = req.body;

    try {
        await pool.query(
            'UPDATE Categoria SET nombre = ?, descripcion = ?, imagen = ? WHERE idCategoria = ?',
            [nombre, descripcion, imagen, id]
        );
        res.json({ message: 'Categoría actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar categoría' });
    }
});

export default router;