const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cart = sequelize.define('cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'carts',
  timestamps: true
});

module.exports = Cart;
