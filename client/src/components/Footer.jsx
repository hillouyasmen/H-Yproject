import React from 'react';
import '../styles/footer.css';
import { FaFacebookF, FaInstagram, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <h3>H&Y Moda</h3>
      <p>Your Luxury Body Shaping Destination</p>
      <p>&copy; {new Date().getFullYear()} All rights reserved.</p>

      <div className="footer-links">
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a href="#privacy">Privacy Policy</a>
      </div>

      <div className="social-icons">
        <a href="https://facebook.com" target="_blank" rel="noreferrer">
          <FaFacebookF />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer">
          <FaInstagram />
        </a>
        <a href="mailto:contact@hymoda.com">
          <FaEnvelope />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
