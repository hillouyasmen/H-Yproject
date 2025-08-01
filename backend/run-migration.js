const { up } = require('./migrations/002_add_reset_token_fields');

async function runMigration() {
  try {
    console.log('Running migration to add reset token fields...');
    await up();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
