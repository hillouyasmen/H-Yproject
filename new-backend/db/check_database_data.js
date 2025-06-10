const { pool } = require('../db');

async function checkDatabaseData() {
    try {
        // Check categories
        console.log('Checking categories...');
        const [categories] = await pool.query('SELECT * FROM categories');
        console.log('Categories:', categories);

        // Check products
        console.log('\nChecking products...');
        const [products] = await pool.query('SELECT * FROM products');
        console.log('Products:', products);

        // Check product_category relationships
        console.log('\nChecking product_category relationships...');
        const [relationships] = await pool.query('SELECT * FROM product_category');
        console.log('Product-Category Relationships:', relationships);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDatabaseData();
