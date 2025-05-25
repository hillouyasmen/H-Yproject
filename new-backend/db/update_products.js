const { pool } = require('../db');

async function updateProducts() {
    try {
        // Get the category ID for boys clothing
        const [categories] = await pool.query('SELECT id FROM categories WHERE name = ?', ['בגדי בנים']);
        const boysCategoryId = categories[0]?.id;

        if (!boysCategoryId) {
            console.error('Boys category not found');
            process.exit(1);
        }

        // Update existing products to be in the boys category
        await pool.query(
            'UPDATE products SET category_id = ? WHERE name IN (?, ?, ?)',
            [
                boysCategoryId,
                'חליפת גברים קלאסית',
                'חולצת כפתורים',
                'ג׳ינס סקיני'
            ]
        );

        console.log('Products updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating products:', error);
        process.exit(1);
    }
}

updateProducts();
