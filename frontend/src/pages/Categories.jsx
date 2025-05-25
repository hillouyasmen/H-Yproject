import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/Categories.css";

const Categories = () => {
  const categories = [
    {
      id: "dresses",
      title: "שמלות",
      image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?ixlib=rb-4.0.3",
      description: "שמלות אלגנטיות ומיוחדות לכל אירוע",
      items: 24
    },
    {
      id: "skirts",
      title: "חצאיות",
      image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?ixlib=rb-4.0.3",
      description: "חצאיות מעוצבות במגוון סגנונות",
      items: 20
    },
    {
      id: "tops",
      title: "חולצות",
      image: "https://images.unsplash.com/photo-1551048632-c72a365b176e?ixlib=rb-4.0.3",
      description: "חולצות וטופים אופנתיים",
      items: 36
    },
    {
      id: "pants",
      title: "מכנסיים",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3",
      description: "מכנסיים אופנתיים ונוחים",
      items: 28
    },
    {
      id: "accessories",
      title: "אקססוריז",
      image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?ixlib=rb-4.0.3",
      description: "תכשיטים ואביזרי אופנה משלימים",
      items: 45
    }
  ];

  return (
    <div className="categories-container">
      <motion.h1
        className="categories-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Women's Collections
      </motion.h1>

      <motion.div
        className="categories-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            className="category-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -10 }}
          >
            <Link to={`/category/${category.id}`}>
              <div className="category-image-container">
                <img src={category.image} alt={category.title} />
                <div className="category-overlay">
                  <span>EXPLORE</span>
                </div>
              </div>
              <div className="category-info">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className="items-count">{category.items} פריטים</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Categories;
