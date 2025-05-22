import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {

  const summerCollection = [
    {
      id: "dresses",
      title: "SUMMER DRESSES",
      image: "images/dress1.jpg",
      link: "/shop/dresses",
    },
    {
      id: "tops",
      title: "SUMMER TOPS",
      image: "images/tops2.jpg",
      link: "/shop/tops",
    },
    {
      id: "beachwear",
      title: "BEACHWEAR",
      image: "images/beachware.jpg",
      link: "/shop/beachwear",
    },
  ];

  const bodyTypes = [
    {
      type: "hourglass",
      image: "images/p1.png",
      title: "Hourglass",
      description:
        "Balanced bust and hips with a defined waist. We'll help you showcase your naturally proportioned silhouette.",
    },
    {
      type: "pear",
      image: "images/p2.png",
      title: "Pear",
      description:
        "Narrower shoulders and bust with fuller hips. Discover styles that balance your proportions and celebrate your feminine silhouette.",
    },
    {
      type: "apple",
      image: "images/p3.png",
      title: "Apple",
      description:
        "Fuller bust and midsection with slender legs. Find flattering styles that create a balanced silhouette and highlight your best features.",
    },
    {
      type: "rectangle",
      image: "images/p4.png",
      title: "Rectangle",
      description:
        "Balanced proportions with little waist definition. Explore styles that create curves and add dimension to your silhouette.",
    },
  ];

  return (
    <div className="home-container">
      <div className="zara-layout">
        <motion.section
          className="hero-banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <video autoPlay muted loop playsInline className="hero-video">
            <source src="images/video2.mp4" type="video/mp4" />
          </video>
          <div className="hero-content">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              NEW SEASON
            </motion.h1>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Link to="/shop" className="hero-link">
                Shop Now
              </Link>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="summer-categories"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="category-grid">
            {summerCollection.map((category) => (
              <motion.div
                key={category.id}
                className="category-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Link to={category.link} className="category-link">
                  <div className="category-image-container">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="category-image"
                    />
                  </div>
                  <div className="category-info">
                    <h3>{category.title}</h3>
                    <span className="view-text">VIEW</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <section className="body-types-section">
          <h2 className="section-title">SHOP BY BODY TYPE</h2>
          <div className="body-types-grid">
            {bodyTypes.map((type) => (
              <motion.div
                key={type.type}
                className="body-type-card"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Link to={`/bodytype/${type.type}`}>
                  <img src={type.image} alt={`${type.title} Body Type`} />
                  <div className="body-type-content">
                    <h3>{type.title}</h3>
                    <p>{type.description}</p>
                    <span className="explore-btn">EXPLORE</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="newsletter-section">
          <div className="newsletter-content">
            <h2>JOIN OUR NEWSLETTER</h2>
            <p>Subscribe to get special offers, free giveaways, and updates</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Your email address" />
              <button type="submit">SUBSCRIBE</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
