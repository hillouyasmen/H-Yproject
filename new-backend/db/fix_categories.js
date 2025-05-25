const { pool } = require('../db');

async function fixCategories() {
    try {
        // Drop existing categories table if it exists
        await pool.query('DROP TABLE IF EXISTS categories');

        // Create categories table with correct structure
        await pool.query(`
            CREATE TABLE categories (
                category_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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

        // Add category_id column to products if it doesn't exist
        await pool.query(`
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS category_id INT,
            ADD FOREIGN KEY IF NOT EXISTS (category_id) REFERENCES categories(category_id)
        `);

        console.log('Categories table fixed and initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing categories:', error);
        process.exit(1);
    }
}

fixCategories();
