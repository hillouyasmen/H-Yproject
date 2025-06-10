const { pool } = require('../db');

async function checkProductsTable() {
    try {
        // Check table structure
        const [columns] = await pool.query('DESCRIBE products');
        console.log('Products table columns:', columns);

        // Get all products
        const [products] = await pool.query('SELECT * FROM products');
        console.log('Products:', products);

        // Get all categories
        const [categories] = await pool.query('SELECT * FROM categories');
        console.log('Categories:', categories);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProductsTable();
