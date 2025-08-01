const path = require('path');
const fs = require('fs').promises;
const db = require('./db');

async function runSqlFile(filePath) {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    for (const statement of statements) {
      if (statement.trim() !== '') {
        await db.query(statement);
      }
    }
    return true;
  } catch (error) {
    console.error('Error running SQL file:', error);
    throw error;
  }
}

async function runMigrations() {
  console.log('Running migrations...');
  
  // Get all migration files in the migrations directory
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = (await fs.readdir(migrationsDir))
    .filter(file => (file.endsWith('.js') || file.endsWith('.sql')) && file !== 'index.js')
    .sort();
  
  // Run each migration
  for (const file of migrationFiles) {
    try {
      console.log(`\nRunning migration: ${file}`);
      
      if (file.endsWith('.js')) {
        // JavaScript migration
        const migration = require(path.join(migrationsDir, file));
        await migration.up();
      } else if (file.endsWith('.sql')) {
        // SQL migration
        await runSqlFile(path.join(migrationsDir, file));
      }
      
      console.log(`✅ ${file} completed successfully`);
    } catch (error) {
      console.error(`❌ Error running migration ${file}:`, error);
      process.exit(1);
    }
  }
  
  console.log('\nAll migrations completed successfully!');
  process.exit(0);
}

// Run migrations
runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
