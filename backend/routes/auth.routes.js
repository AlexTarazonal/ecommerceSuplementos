import { Router } from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// RUTA DE REGISTRO (POST /api/auth/registro)
router.post('/register', async (req, res) => {
    const { nombre, apellido, telefono, email, password } = req.body;

    try {
        // 1. Verificar si el usuario ya existe
        const [rows] = await pool.query('SELECT * FROM Usuario WHERE correoElectronico = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Insertar en la base de datos
        // Asignamos rol 'cliente' por defecto y estado 1 (Activo)
        const [result] = await pool.query(
            'INSERT INTO Usuario (nombre, apellido, telefono, correoElectronico, passwordHash, rol, idEstadoCliente, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [nombre, apellido, telefono, email, passwordHash, 'cliente', 1]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente', id: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// RUTA DE LOGIN (POST /api/auth/login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar usuario
        const [users] = await pool.query('SELECT * FROM Usuario WHERE correoElectronico = ?', [email]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];

        // 2. Comparar contraseña encriptada
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // 3. Crear Token (JWT)
        const token = jwt.sign(
            { id: user.idCliente, rol: user.rol, nombre: user.nombre },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.idUsuario,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.correoElectronico,
                telefono: user.telefono,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

export default router;