const { pool } = require('../db');

async function updateProducts() {
    try {
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

        // Add new women's products
        const products = [
            {
                name: 'שמלת ערב אלגנטית',
                description: 'שמלת ערב ארוכה בצבע שחור עם תחרה',
                price: 599.99,
                rating: 4.5,
                quantity: 10
            },
            {
                name: 'חצאית מידי פליסה',
                description: 'חצאית מידי בצבע בז׳ עם קפלים',
                price: 199.99,
                rating: 4.3,
                quantity: 20
            },
            {
                name: 'חולצת משי',
                description: 'חולצת משי אלגנטית בצבע לבן',
                price: 249.99,
                rating: 4.6,
                quantity: 15
            }
        ];

        for (const product of products) {
            await pool.query(
                'INSERT INTO products (name, description, price, rating, quantity) VALUES (?, ?, ?, ?, ?)',
                [product.name, product.description, product.price, product.rating, product.quantity]
            );
        }

        console.log('Added women\'s products');
        process.exit(0);
    } catch (error) {
        console.error('Error updating products:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

updateProducts();
