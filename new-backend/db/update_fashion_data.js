const { pool } = require('../db');

async function updateFashionData() {
    try {
        // Clear existing categories and products
        await pool.query('DELETE FROM product_category');
        await pool.query('DELETE FROM products');
        await pool.query('DELETE FROM categories');

        // Insert fashion categories
        const categories = [
            { name: 'שמלות', description: 'שמלות אלגנטיות ומיוחדות לכל אירוע' },
            { name: 'חצאיות', description: 'חצאיות מעוצבות במגוון סגנונות' },
            { name: 'חולצות', description: 'חולצות וטופים אופנתיים' },
            { name: 'מכנסיים', description: 'מכנסיים אופנתיים ונוחים' },
            { name: 'אקססוריז', description: 'תכשיטים ואביזרי אופנה משלימים' }
        ];

        // First insert categories and get their IDs
        const categoryIds = [];
        for (const category of categories) {
            const [result] = await pool.query(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [category.name, category.description]
            );
            categoryIds.push(result.insertId);
        }

        // Insert fashion products with proper categorization
        const products = [
            {
                name: 'שמלת ערב אלגנטית',
                description: 'שמלת ערב ארוכה בצבע שחור עם תחרה',
                price: 599.99,
                rating: 4.5,
                quantity: 10,
                image_url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?ixlib=rb-4.0.3'
            },
            {
                name: 'חצאית מידי פליסה',
                description: 'חצאית מידי בצבע בז׳ עם קפלים',
                price: 199.99,
                rating: 4.3,
                quantity: 20,
                image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?ixlib=rb-4.0.3'
            },
            {
                name: 'חולצת משי',
                description: 'חולצת משי לבנה עם ריבועים',
                price: 149.99,
                rating: 4.6,
                quantity: 30,
                image_url: 'https://images.unsplash.com/photo-1551048632-c72a365b176e?ixlib=rb-4.0.3'
            },
            {
                name: 'ג׳ינס סקיני',
                description: 'ג׳ינס בגזרה צמודה בצבע כחול כהה',
                price: 249.99,
                rating: 4.7,
                quantity: 25,
                image_url: 'https://images.unsplash.com/photo-1594633312681-9d6647bca1ed?ixlib=rb-4.0.3'
            },
            {
                name: 'צמיד זהב',
                description: 'צמיד זהב רזה עם אבני אופל',
                price: 399.99,
                rating: 4.8,
                quantity: 15,
                image_url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?ixlib=rb-4.0.3'
            }
        ];

        // Insert products and create relationships
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const categoryId = categoryIds[i]; // Use the actual category ID from the database
            
            const [result] = await pool.query(
                'INSERT INTO products (name, description, price, rating, quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)',
                [product.name, product.description, product.price, product.rating, product.quantity, product.image_url]
            );
            
            // Create relationship with category
            await pool.query(
                'INSERT INTO product_category (product_id, category_id) VALUES (?, ?)',
                [result.insertId, categoryId]
            );
        }

        console.log('Database updated successfully with fashion data');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateFashionData();
