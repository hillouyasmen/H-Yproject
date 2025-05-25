const { pool } = require('../db');

const categories = [
    { name: 'בגדי בנים', description: 'בגדים לבנים' },
    { name: 'בגדי בנות', description: 'בגדים לבנות' },
    { name: 'אקססוריז', description: 'תכשיטים ואביזרי אופנה' },
    { name: 'נעליים', description: 'נעליים לילדים' },
    { name: 'תיקים', description: 'תיקים ותיקי בית ספר' }
];

async function initializeCategories() {
    try {
        // Create categories table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Categories table created successfully');

        // Insert categories
        for (const category of categories) {
            await pool.query(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [category.name, category.description]
            );
        }
        console.log('Categories inserted successfully');

        // Add category_id column to products table if it doesn't exist
        await pool.query(`
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS category_id INT,
            ADD FOREIGN KEY (category_id) REFERENCES categories(id)
        `);
        console.log('Products table updated successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

initializeCategories();
