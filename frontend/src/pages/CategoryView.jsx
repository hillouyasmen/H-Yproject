import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/CategoryView.css";

const CategoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        // Fetch all categories
        const categoriesRes = await fetch('http://localhost:4001/api/categories');
        const categories = await categoriesRes.json();
        const category = categories.find(c => c.category_id === parseInt(id));
        if (!category) throw new Error('Category not found');
        setCategory(category);

        // Fetch products for this category
        const productsRes = await fetch(`http://localhost:4001/api/products/category/${id}`);
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        const productsData = await productsRes.json();
        setProducts(productsData);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [id]);
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = [
    { name: "שחור", value: "black" },
    { name: "לבן", value: "white" },
    { name: "אפור", value: "gray" },
    { name: "כחול", value: "blue" },
    { name: "אדום", value: "red" },
    { name: "ורוד", value: "pink" },
    { name: "בז׳", value: "beige" },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSize =
      selectedSize === "all" || product.sizes.includes(selectedSize);
    const matchesColor =
      selectedColor === "all" || product.colors.includes(selectedColor);
    const matchesPrice =
      product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSize && matchesColor && matchesPrice;
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!category) return <div className="error">Category not found</div>;

  return (
    <div className="category-view">
      <div className="category-header">
        <h2>{category.name}</h2>
        <button className="close-button" onClick={() => navigate(-1)}>
          ×
        </button>
      </div>

      <div className="category-content">
        <div className="filters-sidebar">
          <div className="filter-section">
            <h3>מידות</h3>
            <div className="size-buttons">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`size-button ${
                    selectedSize === size ? "active" : ""
                  }`}
                  onClick={() =>
                    setSelectedSize(size === selectedSize ? "all" : size)
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>צבעים</h3>
            <div className="color-buttons">
              {colors.map((color) => (
                <button
                  key={color.value}
                  className={`color-button ${
                    selectedColor === color.value ? "active" : ""
                  }`}
                  onClick={() =>
                    setSelectedColor(
                      color.value === selectedColor ? "all" : color.value
                    )
                  }
                >
                  <span
                    className="color-dot"
                    style={{ backgroundColor: color.value }}
                  ></span>
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>טווח מחירים</h3>
            <div className="price-range">
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], parseInt(e.target.value)])
                }
              />
              <div className="price-labels">
                <span>₪{priceRange[0]}</span>
                <span>₪{priceRange[1]}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                {product.onSale && <span className="sale-badge">מבצע</span>}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-details">
                  <div className="product-colors">
                    {product.colors.map((color) => (
                      <span
                        key={color}
                        className="color-dot"
                        style={{ backgroundColor: color }}
                        title={colors.find((c) => c.value === color)?.name}
                      ></span>
                    ))}
                  </div>
                  <div className="product-sizes">
                    {product.sizes.map((size) => (
                      <span key={size} className="size-tag">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="product-price">
                  {product.onSale ? (
                    <>
                      <span className="original-price">
                        ₪{product.originalPrice}
                      </span>
                      <span className="sale-price">₪{product.price}</span>
                    </>
                  ) : (
                    <span>₪{product.price}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryView;
