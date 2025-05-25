import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import '../styles/Products.css';

const BoyShop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Assuming category ID 1 is for boys
                const response = await axios.get('http://localhost:4000/api/categories/1/products');
                setProducts(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleAddToCart = (product) => {
        addToCart(product);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="products-container">
            <h2>בגדי בנים</h2>
            <div className="products-grid">
                {products.map((product) => (
                    <div key={product.product_id} className="product-card">
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p className="price">₪{product.price}</p>
                        <div className="product-details">
                            <span className="rating">Rating: {product.rating}★</span>
                            <span className="stock">In Stock: {product.quantity}</span>
                        </div>
                        <button 
                            onClick={() => handleAddToCart(product)}
                            className="add-to-cart-btn"
                        >
                            הוסף לסל
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BoyShop;
