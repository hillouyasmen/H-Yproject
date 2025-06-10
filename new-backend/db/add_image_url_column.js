const { pool } = require('../db');

async function addImageUrlColumn() {
    try {
        // Add image_url column to products table if it doesn't exist
        await pool.query(`
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS image_url VARCHAR(255)
        `);
        console.log('Added image_url column to products table');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addImageUrlColumn();
