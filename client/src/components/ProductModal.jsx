import React, { useState } from 'react';

// دالة مساعدة لجلب الصورة من public/images (لو حبيت تستخدمها)
const getProductImage = (image) => {
  if (!image) return process.env.PUBLIC_URL + '/images/placeholder-product.jpg';
  if (typeof image === 'string' && image.startsWith('http')) return image;
  if (typeof image === 'string' && image.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return process.env.PUBLIC_URL + `/images/products/${image}`;
  }
  return process.env.PUBLIC_URL + '/images/placeholder-product.jpg';
};

const ProductModal = ({ product, onClose, onAddToCart, onOrderNow }) => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [orderData, setOrderData] = useState({
    name: '',
    phone: '',
    address: '',
    credit_card_number: '',
    credit_card_expiry: '',
    credit_card_cvv: ''
  });

  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    if (typeof onOrderNow === 'function') {
      await onOrderNow({
        ...orderData,
        product,
        quantity,
      });
      setShowOrderForm(false);
      onClose();
    } else {
      alert("Order Now function is not implemented! (onOrderNow prop missing)");
    }
  };

  if (!product) return null;

  // استخدم الدالة لجلب الصورة الصحيحة
  const productImg =
    product.image ||
    (Array.isArray(product.images) && product.images.length ? product.images[0] : null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        {!showOrderForm ? (
          <div>
            <img
              src={getProductImage(productImg)}
              alt={product.name}
              style={{ maxWidth: 200, borderRadius: 10 }}
              onError={e => {
                e.target.onerror = null;
                e.target.src = process.env.PUBLIC_URL + '/images/placeholder-product.jpg';
              }}
            />
            <h2>{product.name}</h2>
            <p>₪{product.price}</p>
            <p>{product.description}</p>
            <div style={{ margin: '16px 0' }}>
              <label>Quantity: </label>
              <input
                type="number"
                value={quantity}
                min={1}
                onChange={e => setQuantity(Number(e.target.value))}
                style={{ width: '50px', textAlign: 'center' }}
              />
            </div>
            <button className="btn" onClick={() => onAddToCart && onAddToCart(product, quantity)}>Add to Cart</button>
            <button className="btn" style={{ marginLeft: 8 }} onClick={() => setShowOrderForm(true)}>Order Now</button>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3>Order Form</h3>
            <input required placeholder="Your Name" value={orderData.name} onChange={e => setOrderData(d => ({ ...d, name: e.target.value }))} />
            <input required placeholder="Phone" value={orderData.phone} onChange={e => setOrderData(d => ({ ...d, phone: e.target.value }))} />
            <input required placeholder="Address" value={orderData.address} onChange={e => setOrderData(d => ({ ...d, address: e.target.value }))} />
            <input required placeholder="Credit Card Number" value={orderData.credit_card_number} onChange={e => setOrderData(d => ({ ...d, credit_card_number: e.target.value }))} />
            <input required placeholder="MM/YY" value={orderData.credit_card_expiry} onChange={e => setOrderData(d => ({ ...d, credit_card_expiry: e.target.value }))} />
            <input required placeholder="CVV" value={orderData.credit_card_cvv} onChange={e => setOrderData(d => ({ ...d, credit_card_cvv: e.target.value }))} />
            <button className="btn" type="submit">Confirm Order</button>
            <button className="btn" type="button" onClick={() => setShowOrderForm(false)}>Back</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
