import { Router } from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const router = Router();

// 1. OBTENER TODOS LOS USUARIOS
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.idUsuario as id,
                u.nombre,
                u.apellido,
                u.correoElectronico as email,
                u.telefono,
                u.rol,
                u.fechaRegistro,
                ec.nombreEstado as estado,
                u.idEstadoCliente
            FROM Usuario u
            LEFT JOIN EstadoCliente ec ON u.idEstadoCliente = ec.idEstadoCliente
            ORDER BY u.fechaRegistro DESC
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// 2. CREAR USUARIO (Admin crea usuario manualmente)
router.post('/', async (req, res) => {
    const { nombre, apellido, email, telefono, rol, idEstadoCliente, password } = req.body;

    try {
        // Encriptar contraseña por defecto o la enviada
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password || '123456', salt); // Default 123456 si no envían

        const [result] = await pool.query(
            'INSERT INTO Usuario (nombre, apellido, correoElectronico, telefono, rol, idEstadoCliente, passwordHash, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [nombre, apellido, email, telefono, rol, idEstadoCliente, hash]
        );
        res.status(201).json({ id: result.insertId, message: 'Usuario creado' });
    } catch (error) {
        console.error(error);
        // Error común: Email duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

// 3. EDITAR USUARIO
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, rol, idEstadoCliente, password } = req.body;

    try {
        let sql = 'UPDATE Usuario SET nombre=?, apellido=?, correoElectronico=?, telefono=?, rol=?, idEstadoCliente=?';
        let params = [nombre, apellido, email, telefono, rol, idEstadoCliente];

        // Si el admin escribió una nueva contraseña, la actualizamos. Si no, la dejamos igual.
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            sql += ', passwordHash=?';
            params.push(hash);
        }

        sql += ' WHERE idUsuario=?';
        params.push(id);

        await pool.query(sql, params);
        res.json({ message: 'Usuario actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

// 4. ELIMINAR USUARIO
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Usuario WHERE idUsuario = ?', [id]);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        // Posible error de llave foránea si el usuario tiene pedidos
        res.status(500).json({ message: 'No se puede eliminar usuario con historial de compras' });
    }
});

export default router;