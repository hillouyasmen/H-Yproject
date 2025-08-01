const db = require('./db');

async function fixDatabase() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('🛠️  Fixing database schema...');
    
    // Create orders table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        shipping_address TEXT,
        payment_method VARCHAR(50),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // Create order_items table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price_per_unit DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // Add missing columns to orders table
    await connection.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) AFTER user_id,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending' AFTER total_amount,
      ADD COLUMN IF NOT EXISTS shipping_address TEXT AFTER status,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) AFTER shipping_address,
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) AFTER payment_method,
      ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) AFTER customer_name,
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50) AFTER customer_email,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    
    // If total_price exists but total_amount doesn't, copy the data
    try {
      await connection.query(`
        UPDATE orders 
        SET total_amount = total_price 
        WHERE total_amount IS NULL AND total_price IS NOT NULL
      `);
    } catch (err) {
      console.log('ℹ️  No total_price column to migrate or already migrated');
    }
    
    // If total_amount is still NULL, set it to 0
    await connection.query(`
      UPDATE orders 
      SET total_amount = 0 
      WHERE total_amount IS NULL
    `);
    
    await connection.commit();
    console.log('✅ Database schema fixed successfully');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error fixing database:', error);
    throw error;
  } finally {
    connection.release();
    // Close the connection pool
    await db.end();
    process.exit();
  }
}

fixDatabase();
