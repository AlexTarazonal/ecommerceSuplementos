import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import productsRoutes from './routes/products.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import usersRoutes from './routes/users.routes.js';
import salesRoutes from './routes/sales.routes.js';
import shopRoutes from './routes/shop.routes.js';
import addressRoutes from './routes/address.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import clientRoutes from './routes/client.routes.js';

const app = express();

// Middlewares
app.use(cors()); // Permite conexiones externas (Svelte)
app.use(express.json()); // Permite leer JSON en el body

// Rutas organizadas
// Todas las rutas de auth empezarán con /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriesRoutes);
app.use('/api/productos', productsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/pedidos', salesRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/direcciones', addressRoutes);
app.use('/api/envios', shippingRoutes);
app.use('/api/cliente', clientRoutes);

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});