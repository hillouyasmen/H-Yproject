import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/About.css";

const About = () => {
  const fadeInUp = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="about-container">
      <motion.section
        className="about-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="about-hero-content">
          <motion.h1
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
          >
            Our Story
          </motion.h1>
          <motion.p
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.4 }}
          >
            H&Y MODA was born from a passion for fashion and the understanding
            that every woman deserves to feel beautiful and confident. We
            believe that proper styling begins with understanding your body
            type.
          </motion.p>
        </div>
      </motion.section>

      <motion.section
        className="about-mission"
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={{ ...fadeInUp.transition, delay: 0.6 }}
      >
        <div className="mission-content">
          <h2>Our Vision</h2>
          <p>
            Our mission is to help every woman find the perfect clothes that
            flatter her body type, with an emphasis on comfort, quality, and
            style. We believe that every body is beautiful, and our mission is
            to help you feel confident and comfortable in your clothes.
          </p>
        </div>
      </motion.section>

      <motion.section
        className="about-features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <motion.div
          className="feature-card"
          whileHover={{ y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <i className="fas fa-tshirt"></i>
          <h3>Personal Styling</h3>
          <p>
            Our experts will help you find the perfect style that suits your
            body type
          </p>
        </motion.div>

        <motion.div
          className="feature-card"
          whileHover={{ y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <i className="fas fa-gem"></i>
          <h3>Premium Quality</h3>
          <p>We carefully select the finest fabrics and materials</p>
        </motion.div>

        <motion.div
          className="feature-card"
          whileHover={{ y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <i className="fas fa-heart"></i>
          <h3>Personal Service</h3>
          <p>
            Our expert team is here for you with personal consultation and
            guidance
          </p>
        </motion.div>
      </motion.section>

      <motion.section
        className="about-team"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <h2>Our Team</h2>
        <div className="team-grid">
          <motion.div
            className="team-member"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src={require("../assets/team1.jpg")} alt="Sarah Cohen" />
            <h3>Sarah Cohen</h3>
            <p>Founder & CEO</p>
          </motion.div>
          <motion.div
            className="team-member"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src={require("../assets/team2.jpg")} alt="Rachel Levy" />
            <h3>Rachel Levy</h3>
            <p>Head of Styling</p>
          </motion.div>
          <motion.div
            className="team-member"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src={require("../assets/team3.jpg")} alt="Michelle David" />
            <h3>Michelle David</h3>
            <p>Fashion Consultant</p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="about-cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <h2>Ready to Start?</h2>
        <p>Join us on a journey to discover your personal style</p>
        <div className="cta-buttons">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/signup" className="cta-btn primary">
              Sign Up Now
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/shop" className="cta-btn secondary">
              Visit Shop
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
