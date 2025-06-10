import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>המגזר הנשי</h3>
          <p>מוצרי אופנה מותאמים למגזר הנשי</p>
        </div>
        <div className="footer-section">
          <h3>צור קשר</h3>
          <p>אימייל: info@hy-project.com</p>
          <p>טלפון: 050-123-4567</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 H&Y Project. כל הזכויות שמורות</p>
      </div>
    </footer>
  );
};

export default Footer;
