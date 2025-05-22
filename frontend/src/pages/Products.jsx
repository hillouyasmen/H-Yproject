import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Products.css";
import { Favorite, FavoriteBorder, LocalMall } from "@mui/icons-material";
import FilterPanel from "./FilterPanel";

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

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
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
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-image">
              <img
                src={
                  product.image.startsWith("/uploads")
                    ? `http://localhost:5000${product.image}`
                    : product.image
                }
                alt={product.name}
              />
              <button
                className="favorite-btn"
                onClick={() => toggleFavorite(product._id)}
              >
                {favorites.includes(product._id) ? (
                  <Favorite />
                ) : (
                  <FavoriteBorder />
                )}
              </button>
              {product.discount > 0 && (
                <div className="discount-badge">{product.discount}% הנחה</div>
              )}
              <button className="quick-add-btn">
                <LocalMall /> הוסף לסל
              </button>
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <div className="price-container">
                {product.discount > 0 ? (
                  <>
                    <span className="original-price">
                      {formatPrice(product.price)}
                    </span>
                    <span className="discounted-price">
                      {formatPrice(
                        product.price * (1 - product.discount / 100)
                      )}
                    </span>
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
                <span className="size">{product.size}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
