const { pool } = require('../db');

async function checkTable() {
    try {
        const [rows] = await pool.query('DESCRIBE products');
        console.log('Products table structure:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTable();
