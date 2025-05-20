import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/BodyTypeShop.css";
const BodyTypeShop = () => {
  const { bodyType } = useParams();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "dresses", name: "שמלות", image: "/images/categories/dresses.jpg" },
    { id: "tops", name: "חולצות", image: "/images/categories/tops.jpg" },
    { id: "bottoms", name: "מכנסיים", image: "/images/categories/bottoms.jpg" },
    {
      id: "outerwear",
      name: "מעילים",
      image: "/images/categories/outerwear.jpg",
    },
    {
      id: "accessories",
      name: "אקססוריז",
      image: "/images/categories/accessories.jpg",
    },
  ];

  const bodyTypeNames = {
    hourglass: "שעון חול",
    pear: "אגס",
    apple: "תפוח",
    rectangle: "מלבן",
  };

  const bodyTypeDescriptions = {
    hourglass:
      "מבנה גוף שעון חול מתאפיין בכתפיים ומותניים מאוזנים, עם מותן מודגש.",
    pear: "מבנה גוף אגס מתאפיין בכתפיים צרות יחסית למותניים, עם ירכיים רחבות.",
    apple: "מבנה גוף תפוח מתאפיין בכתפיים רחבות, מותן פחות מוגדר וירכיים צרות.",
    rectangle: "מבנה גוף מלבן מתאפיין במידות דומות בכתפיים, מותן וירכיים.",
  };

  useEffect(() => {
    fetchProducts();
  }, [bodyType, selectedCategory]);

  const fetchProducts = async () => {
    try {
      let url = `http://localhost:5000/api/products/bodytype/${bodyType}`;
      if (selectedCategory !== "all") {
        url += `?category=${selectedCategory}`;
      }
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(price);
  };

  return (
    <div className="body-type-shop">
      <div className="body-type-header">
        <h1>פריטים מומלצים למבנה גוף {bodyTypeNames[bodyType]}</h1>
        <p className="body-type-description">
          {bodyTypeDescriptions[bodyType]}
        </p>
      </div>

      <div className="categories-grid">
        <div
          className={
            "category-card " + (selectedCategory === "all" ? "active" : "")
          }
          onClick={() => setSelectedCategory("all")}
        >
          <div className="category-image-container">
            <img src="/images/categories/all.jpg" alt="כל הקטגוריות" />
            <div className="category-overlay">
              <h3>כל הפריטים</h3>
            </div>
          </div>
        </div>
        {categories.map((category) => (
          <div
            key={category.id}
            className={
              "category-card " +
              (selectedCategory === category.id ? "active" : "")
            }
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="category-image-container">
              <img src={category.image} alt={category.name} />
              <div className="category-overlay">
                <h3>{category.name}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-image">
              <img
                src={
                  product.image.startsWith("/uploads")
                    ? "http://localhost:5000" + product.image
                    : product.image
                }
                alt={product.name}
              />
              {product.discount > 0 && (
                <div className="discount-badge">{product.discount}% הנחה</div>
              )}
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
                <span className="size">{product.size}</span>
                {product.color && (
                  <span
                    className="color-dot"
                    style={{ backgroundColor: product.color }}
                  ></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BodyTypeShop;
