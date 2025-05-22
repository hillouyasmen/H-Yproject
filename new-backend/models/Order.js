const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  shipping_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
