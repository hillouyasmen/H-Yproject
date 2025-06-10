const { pool } = require('../db');

async function checkDataIds() {
    try {
        // Get all products with their IDs and names
        const [products] = await pool.query('SELECT product_id, name FROM products');
        console.log('Products:', products);

        // Get all categories with their IDs and names
        const [categories] = await pool.query('SELECT category_id, name FROM categories');
        console.log('Categories:', categories);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDataIds();
