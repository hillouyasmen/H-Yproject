import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Products.css";
import { Favorite, FavoriteBorder, LocalMall, ShoppingCart } from "@mui/icons-material";
import FilterPanel from "./FilterPanel";
import { useCart } from "../context/CartContext";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    priceRange: "",
    size: "",
    bodyType: "",
    color: "",
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const { addToCart, cartItems, removeFromCart } = useCart();
  const [loading, setLoading] = useState(true);

  // Function to check if product should be visible
  const shouldShowProduct = (product) => {
    // Check if product is in stock
    if (product.stock <= 0) return false;
    
    // Check if product is already in cart
    const inCart = cartItems.some(item => item.productId._id === product._id);
    if (inCart) return false;

    // Check filters
    if (filters.category && product.category !== filters.category) return false;
    if (filters.color && product.color !== filters.color) return false;
    if (filters.size && !product.sizes.includes(filters.size)) return false;
    if (filters.bodyType && product.bodyType !== filters.bodyType) return false;

    // Check price range
    const price = product.price * (1 - product.discount / 100);
    if (filters.priceRange === "0-100" && price > 100) return false;
    if (filters.priceRange === "100-200" && (price < 100 || price > 200)) return false;
    if (filters.priceRange === "200+" && price < 200) return false;

    return true;
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1);
      // Remove product from visible products
      setProducts(prev => prev.filter(p => p._id !== product._id));
      alert('המוצר נוסף לסל הקניות');
    } catch (error) {
      alert('שגיאה: ' + error.message);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(price);
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>קולקציה חדשה</h1>
        <div className="filters-toggle">
          <button onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "הסתר סינון" : "סנן מוצרים"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {showFilters && <FilterPanel filters={filters} setFilters={setFilters} />}

      <div className="products-grid">
        {products
          .filter(shouldShowProduct)
          .sort((a, b) => {
            if (filters.sortBy === "newest") {
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return 0;
          })
          .map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                {favorites.includes(product._id) ? (
                  <>
                    <Favorite className="favorite-icon" />
                    <span className="price">{formatPrice(product.price)}</span>
                  </>
                ) : (
                  <span className="price">{formatPrice(product.price)}</span>
                )}
              </div>
              <div className="product-meta">
                {product.color && (
                  <span
                    className="color-dot"
                    style={{ backgroundColor: product.color }}
                  ></span>
                )}
                <span className="size">{product.sizes.join(', ')}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Products;
