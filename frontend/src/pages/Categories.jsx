import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/Categories.css";

const Categories = () => {
  const categories = [
    {
      id: "dresses",
      title: "שמלות",
      image: "/images/dress1.jpg",
      description: "שמלות אלגנטיות לכל אירוע",
      items: 24
    },
    {
      id: "tops",
      title: "חולצות",
      image: "/images/tops2.jpg",
      description: "חולצות וטופים אופנתיים",
      items: 36
    },
    {
      id: "bottoms",
      title: "מכנסיים וחצאיות",
      image: "/images/bot1.jpg",
      description: "מכנסיים, חצאיות ומכנסיים קצרים",
      items: 28
    },
    {
      id: "outerwear",
      title: "מעילים",
      image: "/images/out1.jpg",
      description: "מעילים, ז'קטים ובלייזרים",
      items: 18
    },
    {
      id: "formal",
      title: "בגדים אלגנטיים",
      image: "/images/formal1.jpg",
      description: "בגדים אלגנטיים לאירועים מיוחדים",
      items: 15
    },
    {
      id: "beachwear",
      title: "בגדי ים",
      image: "/images/beachware.jpg",
      description: "בגדי ים ובגדי חוף",
      items: 22
    },
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
