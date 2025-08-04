const db = require('./db');

async function checkTables() {
  try {
    // Check if products table exists
    const [tables] = await db.query(
      "SHOW TABLES LIKE 'products'"
    );
    
    if (tables.length === 0) {
      console.log("❌ Products table does not exist");
      // Create products table if it doesn't exist
      await createProductsTable();
    } else {
      console.log("✅ Products table exists");
      // Check if there are any products
      const [products] = await db.query("SELECT COUNT(*) as count FROM products");
      console.log(`📊 Found ${products[0].count} products in the database`);
      
      // Show first few products if they exist
      if (products[0].count > 0) {
        const [sampleProducts] = await db.query("SELECT * FROM products LIMIT 3");
        console.log("\nSample products:");
        console.log(sampleProducts);
      }
    }
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    process.exit();
  }
}

async function createProductsTable() {
  try {
    console.log("🔄 Creating products table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INT DEFAULT 0,
        category VARCHAR(100),
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        color_id INT,
        size_id INT,
        body_shape VARCHAR(50),
        sku VARCHAR(100)
      )
    `);
    console.log("✅ Products table created successfully");
    
    // Add some sample data
    await db.query(`
      INSERT INTO products (name, description, price, category, image_url, body_shape)
      VALUES 
        ('Sample Product 1', 'Description 1', 99.99, 'Guitar', '/images/guitar1.jpg', 'Strat'),
        ('Sample Product 2', 'Description 2', 149.99, 'Bass', '/images/bass1.jpg', 'Jazz')
    `);
    console.log("✅ Added sample products");
  } catch (error) {
    console.error("Error creating products table:", error);
  }
}

checkTables();
