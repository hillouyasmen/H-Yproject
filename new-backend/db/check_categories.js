const { pool } = require('../db');

async function checkCategories() {
    try {
        const [tables] = await pool.query('SHOW TABLES LIKE "categories"');
        if (tables.length === 0) {
            console.log('Categories table does not exist');
        } else {
            const [rows] = await pool.query('SELECT * FROM categories');
            console.log('Categories:', JSON.stringify(rows, null, 2));
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCategories();
