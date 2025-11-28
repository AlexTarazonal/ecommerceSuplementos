import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Cargar carrito del LocalStorage si existe
/** @type {any[]} */
let initialCart = [];
try {
    const stored = browser ? localStorage.getItem('carrito') : null;
    if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            initialCart = parsed;
        }
    }
} catch (e) {
    console.error('Error loading cart from localStorage:', e);
}

export const cart = writable(initialCart);

// Suscribirse para guardar cambios automáticamente en LocalStorage
if (browser) {
    cart.subscribe((value) => {
        localStorage.setItem('carrito', JSON.stringify(value));
    });
}

// --- ACCIONES ---

/**
 * @param {Object} product
 * @param {string|number} product.idProducto
 * @param {number} [product.stock]
 */
export const addToCart = (product) => {
    cart.update((items) => {
        const existing = items.find((i) => i.idProducto === product.idProducto);
        if (existing) {
            // Validar Stock antes de sumar
            // Si no hay stock definido, asumimos infinito para no bloquear, o ajusta según tu lógica
            const stockMax = product.stock || 9999;
            if (existing.cantidad < stockMax) {
                return items.map((i) =>
                    i.idProducto === product.idProducto ? { ...i, cantidad: i.cantidad + 1 } : i
                );
            }
            return items; // No suma si no hay stock
        }
        return [...items, { ...product, cantidad: 1 }];
    });
};

/**
 * @param {string|number} id
 */
export const removeFromCart = (id) => {
    cart.update((items) => items.filter((i) => i.idProducto !== id));
};

export const clearCart = () => {
    cart.set([]);
};

/**
 * Actualizar cantidad (respetando límites)
 * @param {string|number} id
 * @param {number} newQuantity
 */
export const updateQuantity = (id, newQuantity) => {
    cart.update((items) => {
        return items.map((item) => {
            if (item.idProducto === id) {
                // Validar que no sea menor a 1
                if (newQuantity < 1) return item;
                // Validar que no supere el stock
                if (item.stock && newQuantity > item.stock) return item;

                return { ...item, cantidad: newQuantity };
            }
            return item;
        });
    });
};