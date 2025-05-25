const { pool } = require('../db');

async function updateCategories() {
    try {
        // First, set all category_id values to NULL
        await pool.query('UPDATE products SET category_id = NULL');
        console.log('Reset all category_id values');

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

        // Add foreign key constraint
        await pool.query(`
            ALTER TABLE products
            ADD CONSTRAINT fk_product_category
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        `);
        console.log('Added foreign key constraint');

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

        console.log('Categories updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating categories:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

updateCategories();
