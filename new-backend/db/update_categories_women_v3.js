const { pool } = require('../db');

async function updateCategories() {
    try {
        // First, remove any foreign key constraints
        const [foreignKeys] = await pool.query(`
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'products'
            AND REFERENCED_TABLE_NAME = 'categories'
            AND CONSTRAINT_SCHEMA = DATABASE()
        `);

        // Drop all foreign key constraints
        for (const fk of foreignKeys) {
            await pool.query(`
                ALTER TABLE products
                DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
            `);
            console.log(`Dropped foreign key ${fk.CONSTRAINT_NAME}`);
        }

        // Delete men's/boys' products
        await pool.query(`
            DELETE FROM products 
            WHERE name IN (
                'חליפת גברים קלאסית',
                'חולצת כפתורים',
                'ג׳ינס סקיני'
            )
        `);
        console.log('Deleted men\'s products');

        // Drop and recreate categories table
        await pool.query('DROP TABLE IF EXISTS categories');
        console.log('Dropped categories table');

        await pool.query(`
            CREATE TABLE categories (
                category_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created new categories table');

        // Insert women's categories only
        const categories = [
            { name: 'שמלות', description: 'שמלות לנשים' },
            { name: 'חצאיות', description: 'חצאיות לנשים' },
            { name: 'חולצות', description: 'חולצות וטופים לנשים' },
            { name: 'מכנסיים', description: 'מכנסיים לנשים' },
            { name: 'אקססוריז', description: 'תכשיטים ואביזרי אופנה לנשים' }
        ];

        for (const category of categories) {
            await pool.query(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [category.name, category.description]
            );
        }
        console.log('Inserted women\'s categories');

        console.log('Categories updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating categories:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

updateCategories();
