import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import '../styles/Home.css';

// Using public directory for images
const heroBg = '/images/hero-bg.jpg';

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url(${heroBg}) center/cover no-repeat fixed`
        }}
      >
        <div className="hero-content">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Timeless Elegance, Modern Style
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hero-description"
          >
            Discover our exclusive collection of luxury fashion designed to celebrate your unique beauty and body shape.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/shop" className="cta-button">
              Shop Now <FaArrowRight className="cta-icon" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section 
        className="about-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="about-content">
          <div className="about-text">
            <h2>Our Story</h2>
            <p className="about-description">
              We are a team of passionate students from the Technion, bringing you the finest fashion experience. 
              Our journey began with a shared vision of creating elegant and timeless pieces that celebrate individuality.
            </p>
            <div className="about-team">
              <div className="team-member">
                <h3>Hazem Habrat</h3>
                <p>From Kafr Kanna, 24 years old</p>
              </div>
              <div className="team-member">
                <h3>Yasmeen Hiloou</h3>
                <p>From Arraba, 21 years old</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/about" className="cta-button cta-outline">
                Our Story <FaArrowRight className="cta-icon" />
              </Link>
            </motion.div>
          </div>
          <div className="about-image">
            <div className="image-wrapper">
              <img 
                src={`${process.env.PUBLIC_URL}/images/home-about.jpg`}
                alt="Luxury Fashion"
                className="about-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${process.env.PUBLIC_URL}/images/HH.png`;
                }}
              />
            </div>
          </div>
        </div>
      </motion.section>

  
    </div>
  );
};

export default Home;
