import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import '../styles/OrderConfirmation.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderId, total } = location.state || {};

  return (
    <div className="order-confirmation">
      <div className="confirmation-content">
        <h2>תודה על הזמנתך!</h2>
        <div className="order-details">
          <p>מספר הזמנה: {orderId}</p>
          <p>סכום ששולם: ₪{total?.toFixed(2)}</p>
        </div>
        <p>קיבלנו את הזמנתך בהצלחה. אישור יישלח לכתובת המייל שלך.</p>
        <div className="confirmation-actions">
          <Link to="/orders" className="view-orders-btn">
            צפה בהזמנות שלי
          </Link>
          <Link to="/" className="continue-shopping-btn">
            המשך בקניות
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
