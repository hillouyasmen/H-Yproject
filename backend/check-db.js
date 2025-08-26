const db = require('./db');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if tables exist
    const [tables] = await db.query(`
      SHOW TABLES;
    `);
    
    console.log('\n📋 Found tables:');
    console.table(tables);
    
    // Check orders table structure
    try {
      const [orderColumns] = await db.query(`
        SHOW COLUMNS FROM orders;
      `);
      console.log('\n📋 Orders table columns:');
      console.table(orderColumns);
    } catch (err) {
      console.error('❌ Error checking orders table:', err.message);
    }
    
    // Check order_items table structure
    try {
      const [orderItemsColumns] = await db.query(`
        SHOW COLUMNS FROM order_items;
      `);
      console.log('\n📋 Order items table columns:');
      console.table(orderItemsColumns);
    } catch (err) {
      console.error('❌ Error checking order_items table:', err.message);
    }
    
    // Check if there are any orders
    try {
      const [orders] = await db.query(`
        SELECT * FROM orders LIMIT 5;
      `);
      console.log('\n📋 Sample orders (max 5):');
      console.table(orders);
      
      if (orders.length > 0) {
        const orderId = orders[0].id;
        const [orderItems] = await db.query(`
          SELECT * FROM order_items WHERE order_id = ?;
        `, [orderId]);
        
        console.log(`\n📋 Items for order ${orderId}:`);
        console.table(orderItems);
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    // Close the connection pool
    await db.end();
    process.exit();
  }
}

checkDatabase();
