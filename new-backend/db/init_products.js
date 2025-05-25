const { pool } = require('../db');

const products = [
    {
        name: 'שמלת ערב אלגנטית',
        description: 'שמלת ערב ארוכה בצבע שחור עם תחרה',
        price: 599.99,
        rating: 4.5,
        quantity: 10
    },
    {
        name: 'חליפת גברים קלאסית',
        description: 'חליפת גברים בצבע כחול כהה עם גזרה מודרנית',
        price: 899.99,
        rating: 4.8,
        quantity: 15
    },
    {
        name: 'חצאית מידי פליסה',
        description: 'חצאית מידי בצבע בז׳ עם קפלים',
        price: 199.99,
        rating: 4.3,
        quantity: 20
    },
    {
        name: 'חולצת כפתורים',
        description: 'חולצת כפתורים לבנה קלאסית',
        price: 149.99,
        rating: 4.6,
        quantity: 30
    },
    {
        name: 'ג׳ינס סקיני',
        description: 'ג׳ינס בגזרה צמודה בצבע כחול כהה',
        price: 249.99,
        rating: 4.7,
        quantity: 25
    }
];

async function initializeProducts() {
    try {
        for (const product of products) {
            await pool.query(
                'INSERT INTO products (name, description, price, rating, quantity) VALUES (?, ?, ?, ?, ?)',
                [product.name, product.description, product.price, product.rating, product.quantity]
            );
        }
        console.log('Sample products inserted successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing products:', error);
        process.exit(1);
    }
}

initializeProducts();
