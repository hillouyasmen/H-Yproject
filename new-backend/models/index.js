const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Cart = require('./Cart');
const CartItem = require('./CartItem');

// User Associations
User.hasMany(Order, { foreignKey: 'user_id' });
User.hasOne(Cart, { foreignKey: 'user_id' });

// Category Associations
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Order Associations
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(OrderDetail, { foreignKey: 'order_id' });
OrderDetail.belongsTo(Order, { foreignKey: 'order_id' });
OrderDetail.belongsTo(Product, { foreignKey: 'product_id' });

// Cart Associations
Cart.belongsTo(User, { foreignKey: 'user_id' });
Cart.hasMany(CartItem, { foreignKey: 'cart_id' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  User,
  Product,
  Category,
  Order,
  OrderDetail,
  Cart,
  CartItem
};
