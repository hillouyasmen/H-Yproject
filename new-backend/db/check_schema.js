const { pool } = require('../db');

async function checkSchema() {
    try {
        const [rows] = await pool.query('DESCRIBE products');
        console.log('Products table structure:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
