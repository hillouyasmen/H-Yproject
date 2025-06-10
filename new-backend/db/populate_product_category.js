const { pool } = require('../db');

async function populateProductCategory() {
    try {
        // First, let's check if the product_category table exists
        const [tables] = await pool.query('SHOW TABLES LIKE "product_category"');
        if (tables.length === 0) {
            // Create the table if it doesn't exist
            await pool.query(`
                CREATE TABLE product_category (
                    product_id INT NOT NULL,
                    category_id INT NOT NULL,
                    PRIMARY KEY (product_id, category_id),
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                )
            `);
            console.log('Created product_category table');
        }

        // Clear existing data
        await pool.query('DELETE FROM product_category');
        console.log('Cleared existing product_category data');

        // Get all products and categories
        const [products] = await pool.query('SELECT product_id FROM products');
        const [categories] = await pool.query('SELECT category_id FROM categories');

        if (products.length === 0 || categories.length === 0) {
            console.error('No products or categories found in database');
            process.exit(1);
        }

        // Define product-category relationships based on actual database IDs
        const relationships = [
            // שמלת ערב אלגנטית - Women's Dresses
            { product_id: 1235, category_id: 2 },
            // Jeans - Women's Jeans
            { product_id: 353, category_id: 2 },
            // Shors - Women's Shorts
            { product_id: 454, category_id: 2 },
            // Hats - Accessories
            { product_id: 555, category_id: 3 },
            // Dress - Women's Dresses
            { product_id: 252, category_id: 2 }
        ];

        // Insert relationships
        for (const relationship of relationships) {
            await pool.query(
                'INSERT INTO product_category (product_id, category_id) VALUES (?, ?)',
                [relationship.product_id, relationship.category_id]
            );
        }

        console.log('Product-category relationships populated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

populateProductCategory();
