const { pool } = require('../db');

async function fixCategories() {
    try {
        // First, get all foreign key constraints
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

        // Set all category_id values to NULL
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

        // Insert categories
        const categories = [
            { name: 'בגדי בנים', description: 'בגדים לבנים' },
            { name: 'בגדי בנות', description: 'בגדים לבנות' },
            { name: 'אקססוריז', description: 'תכשיטים ואביזרי אופנה' },
            { name: 'נעליים', description: 'נעליים לילדים' },
            { name: 'תיקים', description: 'תיקים ותיקי בית ספר' }
        ];

        for (const category of categories) {
            await pool.query(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [category.name, category.description]
            );
        }
        console.log('Inserted categories');

        // Get the boys category ID
        const [boysCategory] = await pool.query(
            'SELECT category_id FROM categories WHERE name = ?',
            ['בגדי בנים']
        );

        if (boysCategory.length > 0) {
            // Update specific products to be in the boys category
            await pool.query(
                `UPDATE products 
                 SET category_id = ?
                 WHERE name IN (?, ?, ?)`,
                [
                    boysCategory[0].category_id,
                    'חליפת גברים קלאסית',
                    'חולצת כפתורים',
                    'ג׳ינס סקיני'
                ]
            );
            console.log('Updated product categories');
        }

        // Add foreign key constraint
        await pool.query(`
            ALTER TABLE products
            ADD CONSTRAINT fk_product_category
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        `);
        console.log('Added foreign key constraint');

        console.log('Categories table fixed and initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing categories:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

fixCategories();
