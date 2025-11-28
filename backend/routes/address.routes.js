import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// 1. LISTAR DIRECCIONES DE UN USUARIO
router.get('/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM Direccion WHERE idUsuario = ? ORDER BY esPrincipal DESC, idDireccion DESC',
            [idUsuario]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener direcciones' });
    }
});

// 2. CREAR NUEVA DIRECCIÓN (Con lógica de Principal por defecto)
router.post('/', async (req, res) => {
    const { idUsuario, alias, linea1, ciudad, codigoPostal, referencia } = req.body;

    if (!idUsuario) {
        return res.status(400).json({ message: 'Falta el ID del usuario' });
    }

    try {
        // Verificar si es la primera dirección
        const [existing] = await pool.query('SELECT COUNT(*) as count FROM Direccion WHERE idUsuario = ?', [idUsuario]);
        const esPrincipal = existing[0].count === 0 ? 1 : 0;

        const [result] = await pool.query(
            'INSERT INTO Direccion (idUsuario, alias, linea1, ciudad, codigoPostal, referencia, esPrincipal) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [idUsuario, alias, linea1, ciudad, codigoPostal, referencia, esPrincipal]
        );
        res.status(201).json({
            message: 'Dirección agregada',
            idDireccion: result.insertId,
            esPrincipal: esPrincipal === 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar la dirección' });
    }
});

// 3. EDITAR DIRECCIÓN
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { alias, linea1, ciudad, codigoPostal, referencia } = req.body;

    try {
        await pool.query(
            'UPDATE Direccion SET alias = ?, linea1 = ?, ciudad = ?, codigoPostal = ?, referencia = ? WHERE idDireccion = ?',
            [alias, linea1, ciudad, codigoPostal, referencia, id]
        );
        res.json({ message: 'Dirección actualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la dirección' });
    }
});

// 4. ELIMINAR DIRECCIÓN
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Direccion WHERE idDireccion = ?', [id]);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la dirección' });
    }
});

export default router;