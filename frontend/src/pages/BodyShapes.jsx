import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/BodyShapes.css';

const bodyShapeInfo = {
  hourglass: {
    name: "חול",
    description: "מותניים מוגדרים וכתפיים וירכיים באותו רוחב. נמליץ על בגדים שמדגישים את המותניים",
    image: "/images/hour.png"
  },
  pear: {
    name: "אגס",
    description: "ירכיים רחבות יותר מהכתפיים. נמליץ על בגדים שמאזנים את המראה הכללי",
    image: "/images/traingle.png"
  },
  apple: {
    name: "תפוח",
    description: "חלק עליון רחב יותר עם מותניים פחות מוגדרים. נמליץ על בגדים שיוצרים אשליה של מותניים",
    image: "/images/apple.png"
  },
  rectangle: {
    name: "מלבן",
    description: "כתפיים, מותניים וירכיים באותו רוחב בערך. נמליץ על בגדים שיוצרים אשליית עקומות",
    image: "/images/regtangle.png"
  }
};

const BodyShapes = () => {
  return (
    <div className="body-shapes-container">
      <h1 className="page-title">בחרי את מבנה הגוף שלך</h1>
      <p className="page-subtitle">גלי המלצות אישיות לבגדים שיתאימו לך בול!</p>
      
      <div className="shapes-grid">
        {Object.entries(bodyShapeInfo).map(([shape, info]) => (
          <motion.div
            key={shape}
            className="shape-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={`/categories?shape=${shape}`} className="shape-link">
              <div className="shape-image-container">
                <img src={info.image} alt={info.name} className="shape-image" />
              </div>
              <h3 className="shape-name">{info.name}</h3>
              <p className="shape-description">{info.description}</p>
              <button className="view-clothes-btn">
                צפי בבגדים המומלצים
                <span className="arrow">←</span>
              </button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BodyShapes;
