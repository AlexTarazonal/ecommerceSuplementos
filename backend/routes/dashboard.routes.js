import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/resumen', async (req, res) => {
    try {
        // 1. Ingresos de Hoy (Tabla Pedido)
        const [ingresosHoy] = await pool.query(
            "SELECT COALESCE(SUM(total), 0) as total FROM Pedido WHERE DATE(fechaPedido) = CURDATE() AND idEstadoPedido != 5" // Excluimos cancelados (5)
        );

        // 2. Usuarios Totales
        const [totalUsuarios] = await pool.query("SELECT COUNT(*) as total FROM Usuario");

        // 3. Ventas del Mes (Tabla Pedido)
        const [ventasMes] = await pool.query(
            "SELECT COALESCE(SUM(total), 0) as total FROM Pedido WHERE MONTH(fechaPedido) = MONTH(CURRENT_DATE()) AND YEAR(fechaPedido) = YEAR(CURRENT_DATE()) AND idEstadoPedido != 5"
        );

        // 4. Usuarios Activos (Clientes distintos en Pedidos recientes)
        const [usuariosActivos] = await pool.query(
            "SELECT COUNT(DISTINCT idUsuario) as total FROM Pedido WHERE fechaPedido >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );

        // 5. Gráfico de Ventas (Mensual - Tabla Pedido)
        const [ventasAnualesDB] = await pool.query(`
            SELECT MONTH(fechaPedido) as mes, SUM(total) as total 
            FROM Pedido 
            WHERE YEAR(fechaPedido) = YEAR(CURDATE()) AND idEstadoPedido != 5
            GROUP BY MONTH(fechaPedido) 
            ORDER BY mes ASC
        `);
        const ventasPorMes = Array(12).fill(0);
        ventasAnualesDB.forEach(fila => ventasPorMes[fila.mes - 1] = Number(fila.total));

        // 6. Gráfico Usuarios
        const totalUsers = totalUsuarios[0].total;
        const [compradoresHistoricos] = await pool.query("SELECT COUNT(DISTINCT idUsuario) as total FROM Pedido");
        const compradores = compradoresHistoricos[0].total;
        const sinCompras = totalUsers - compradores;
        const [nuevosRegistros] = await pool.query("SELECT COUNT(*) as total FROM Usuario WHERE fechaRegistro >= DATE_SUB(NOW(), INTERVAL 7 DAY)");

        // 7. KPI Circulares (Ticket promedio y conversión)
        // Conversión = Total Pedidos / (Total Pedidos + Total Carritos Abiertos [estimado])
        // Nota: Como borramos la tabla Carrito de BD, usaremos una estimación o solo Total Pedidos.
        const [ticketProm] = await pool.query("SELECT COALESCE(AVG(total), 0) as promedio FROM Pedido WHERE idEstadoPedido != 5");

        // Simulamos conversión comparando usuarios totales vs usuarios con pedidos
        let tasaConversion = totalUsers > 0 ? Math.round((compradores / totalUsers) * 100) : 0;

        // 8. TIMELINE (Combinando Pedidos y Usuarios Nuevos)
        const [timeline] = await pool.query(`
            (SELECT 
                'orden' as tipo, 
                idPedido as id, 
                fechaPedido as fecha, 
                CONCAT('Nuevo pedido #', idPedido, ' por S/.', total) as titulo, 
                'green' as color 
            FROM Pedido)
            UNION
            (SELECT 
                'usuario' as tipo, 
                idUsuario as id, 
                fechaRegistro as fecha, 
                CONCAT('Nuevo usuario: ', nombre, ' ', apellido) as titulo, 
                'blue' as color 
            FROM Usuario)
            ORDER BY fecha DESC 
            LIMIT 6
        `);

        // 9. TOP PRODUCTOS (Desde DetallePedido y Producto)
        // Calculamos los más vendidos contando cuántas veces aparecen en DetallePedido
        const [productosTop] = await pool.query(`
            SELECT 
                p.nombre, 
                p.precio, 
                p.stock, 
                c.nombre as categoria,
                COUNT(dp.idProducto) as ventas
            FROM Producto p
            LEFT JOIN DetallePedido dp ON p.idProducto = dp.idProducto
            LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
            GROUP BY p.idProducto
            ORDER BY ventas DESC, p.stock ASC
            LIMIT 5
        `);

        res.json({
            dineroHoy: ingresosHoy[0].total,
            usuariosTotales: totalUsers,
            ventasMes: ventasMes[0].total,
            usuariosActivosSemana: usuariosActivos[0].total,
            graficoVentas: ventasPorMes,
            graficoUsuarios: { total: totalUsers, compradores, sinCompras, nuevosSemana: nuevosRegistros[0].total },
            ticketPromedio: ticketProm[0].promedio,
            tasaConversion,
            timeline,
            topProducts: productosTop
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error dashboard' });
    }
});

export default router;