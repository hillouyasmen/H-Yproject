const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hyproject',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync();
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB
};
