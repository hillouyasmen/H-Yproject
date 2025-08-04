const db = require('./db');

async function createTestOrder() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('🛒 Creating test order...');
    
    // Get a user ID (assuming there's at least one user)
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      throw new Error('No users found in the database');
    }
    const userId = users[0].id;
    
    // Get a product ID (assuming there's at least one product)
    const [products] = await connection.query('SELECT id, price FROM products LIMIT 2');
    if (products.length < 2) {
      throw new Error('Need at least 2 products in the database');
    }
    
    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, 
        total_amount, 
        status, 
        shipping_address, 
        payment_method, 
        customer_name, 
        customer_email, 
        customer_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        159.80, // total_amount
        'pending', 
        '123 Test St, Test City, 12345', 
        'credit_card', 
        'Test User', 
        'test@example.com', 
        '123-456-7890'
      ]
    );
    
    const orderId = orderResult.insertId;
    console.log(`✅ Created order with ID: ${orderId}`);
    
    // Add order items
    const orderItems = [
      { product_id: products[0].id, quantity: 2, price_per_unit: products[0].price },
      { product_id: products[1].id, quantity: 1, price_per_unit: products[1].price }
    ];
    
    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, 
          product_id, 
          quantity, 
          price_per_unit
        ) VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price_per_unit]
      );
      
      console.log(`✅ Added item ${item.product_id} to order ${orderId}`);
    }
    
    await connection.commit();
    console.log('✅ Test order created successfully');
    
    return orderId;
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating test order:', error);
    throw error;
  } finally {
    connection.release();
    // Close the connection pool
    await db.end();
    process.exit();
  }
}

createTestOrder();
