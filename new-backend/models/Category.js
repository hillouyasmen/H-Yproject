const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'categories',
  timestamps: true
});

module.exports = Category;
