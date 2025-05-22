import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import '../styles/CartIcon.css';

const CartIcon = () => {
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();

  return (
    <IconButton 
      className="cart-icon"
      onClick={() => navigate('/cart')}
      color="inherit"
      aria-label="cart"
    >
      <Badge badgeContent={getCartItemsCount()} color="error">
        <ShoppingCartIcon />
      </Badge>
    </IconButton>
  );
};

export default CartIcon;
