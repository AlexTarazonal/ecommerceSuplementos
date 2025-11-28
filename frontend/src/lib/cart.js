// src/lib/cart.js o cart.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';


let currentUserKey = 'guest'; 


function resolveUserKeyFromLocalStorage() {
    if (!browser) return 'guest';

    try {
        const raw = localStorage.getItem('usuario');
        if (!raw) return 'guest';

        const user = JSON.parse(raw);
        
        const id = user?.id;

        if (id === null || id === undefined) return 'guest';
        return `user:${id}`;
    } catch (e) {
        console.error('Error leyendo usuario desde localStorage:', e);
        return 'guest';
    }
}

function getStorageKey() {
    
    return `carrito_${currentUserKey}`;
}



let initialCart = [];

if (browser) {
    
    currentUserKey = resolveUserKeyFromLocalStorage();

    try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                initialCart = parsed;
            }
        }
    } catch (e) {
        console.error('Error loading cart from localStorage:', e);
    }
}

export const cart = writable(initialCart);


if (browser) {
    cart.subscribe((value) => {
        try {
            localStorage.setItem(getStorageKey(), JSON.stringify(value));
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    });
}


export function setCartUser(userId) {
    // si no hay user → guest
    currentUserKey = userId != null ? `user:${String(userId)}` : 'guest';

    if (!browser) {
        cart.set([]);
        return;
    }

    try {
        const stored = localStorage.getItem(getStorageKey());
        const parsed = stored ? JSON.parse(stored) : [];
        cart.set(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
        console.error('Error loading user cart:', e);
        cart.set([]);
    }
}


export const addToCart = (product) => {
    cart.update((items) => {
        const existing = items.find((i) => i.idProducto === product.idProducto);
        if (existing) {
            const stockMax = product.stock || existing.stock || 9999;
            if (existing.cantidad < stockMax) {
                return items.map((i) =>
                    i.idProducto === product.idProducto
                        ? { ...i, cantidad: i.cantidad + 1 }
                        : i
                );
            }
            return items;
        }
        return [...items, { ...product, cantidad: 1 }];
    });
};


export const removeFromCart = (id) => {
    cart.update((items) => items.filter((i) => i.idProducto !== id));
};

export const clearCart = () => {
    cart.set([]);
};


export const updateQuantity = (id, newQuantity) => {
    cart.update((items) =>
        items.map((item) => {
            if (item.idProducto === id) {
                if (newQuantity < 1) return item;
                if (item.stock && newQuantity > item.stock) return item;
                return { ...item, cantidad: newQuantity };
            }
            return item;
        })
    );
};
