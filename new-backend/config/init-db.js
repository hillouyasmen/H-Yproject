const { sequelize } = require('./db');
const {
  User,
  Category,
  Product,
  Cart,
  CartItem,
  Order,
  OrderDetail
} = require('../models');

async function initializeDatabase() {
  try {
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created');

    // Create default admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123', // This will be hashed by the model hooks
      full_name: 'System Administrator',
      email: 'admin@example.com',
      phone_number: '1234567890',
      birth_date: '1990-01-01',
      role: 'admin'
    });
    console.log('✅ Admin user created');

    // Create some default categories
    const categories = await Category.bulkCreate([
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Fashion and apparel' },
      { name: 'Books', description: 'Books and literature' },
      { name: 'Home & Garden', description: 'Home decor and gardening items' }
    ]);
    console.log('✅ Default categories created');

    // Create some sample products
    const products = await Product.bulkCreate([
      {
        name: 'Smartphone',
        description: 'Latest model smartphone',
        price: 699.99,
        stock: 50,
        category_id: categories[0].id
      },
      {
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 1299.99,
        stock: 30,
        category_id: categories[0].id
      },
      {
        name: 'T-Shirt',
        description: 'Cotton t-shirt',
        price: 19.99,
        stock: 100,
        category_id: categories[1].id
      },
      {
        name: 'Jeans',
        description: 'Classic blue jeans',
        price: 49.99,
        stock: 75,
        category_id: categories[1].id
      },
      {
        name: 'Novel',
        description: 'Bestselling novel',
        price: 14.99,
        stock: 200,
        category_id: categories[2].id
      }
    ]);
    console.log('✅ Sample products created');

    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
