const { pool } = require('../db');

async function fixCategories() {
    try {
        // First remove the foreign key constraint if it exists
        try {
            await pool.query(`
                ALTER TABLE products
                DROP FOREIGN KEY products_ibfk_1
            `);
            console.log('Removed foreign key constraint');
        } catch (error) {
            // Ignore error if constraint doesn't exist
            console.log('No foreign key constraint found');
        }

        // Drop existing categories table if it exists
        await pool.query('DROP TABLE IF EXISTS categories');
        console.log('Dropped categories table');

        // Create categories table with correct structure
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

        // Make sure category_id column exists in products
        try {
            await pool.query(`
                ALTER TABLE products
                ADD COLUMN category_id INT
            `);
            console.log('Added category_id column');
        } catch (error) {
            console.log('category_id column already exists');
        }

        // Add foreign key constraint
        await pool.query(`
            ALTER TABLE products
            ADD CONSTRAINT products_ibfk_1
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        `);
        console.log('Added foreign key constraint');

        console.log('Categories table fixed and initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing categories:', error);
        process.exit(1);
    }
}

fixCategories();
