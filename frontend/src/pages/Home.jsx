import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const getShapePath = (type) => {
  const paths = {
    'שעון חול': 'M30 10 C50 10 70 10 70 10 C70 30 60 40 50 50 C40 60 30 70 30 90 C50 90 70 90 70 90 C70 70 60 60 50 50 C40 40 30 30 30 10',
    'אגס': 'M40 10 C50 10 60 10 60 10 C60 30 55 40 50 50 C45 60 30 70 30 90 C50 95 70 95 70 90 C70 70 55 60 50 50 C45 40 40 30 40 10',
    'ספורטיבי': 'M35 10 C45 10 55 10 65 10 C65 30 65 70 65 90 C55 90 45 90 35 90 C35 70 35 30 35 10',
    'תפוח': 'M40 10 C50 10 60 10 60 10 C65 30 70 40 70 50 C70 70 60 80 50 80 C40 80 30 70 30 50 C30 40 35 30 40 10'
  };
  return paths[type] || '';
};

const Home = () => {
  const [activeImage, setActiveImage] = React.useState(null);
  const [isHovered, setIsHovered] = React.useState(null);

  const handleImageEnter = (index) => {
    setIsHovered(index);
  };

  const handleImageLeave = () => {
    setIsHovered(null);
  };

  const handleImageClick = (index) => {
    setActiveImage(index === activeImage ? null : index);
  };

  const bodyShapes = [
    { type: 'שעון חול', description: 'איזון מושלם בין הכתפיים למותניים' },
    { type: 'אגס', description: 'מותניים רחבות יותר מהכתפיים' },
    { type: 'ספורטיבי', description: 'מבנה ישר וספורטיבי' },
    { type: 'תפוח', description: 'חלק אמצעי מלא יותר' }
  ];
  const images = [
    "/images/dd1.jpg",
    "/images/dd2.jpg",
    "/images/dd3.jpg",
    "/images/dd4.jpg",
    "/images/dd5.jpg"
  ];
  
  const [currentSlide, setCurrentSlide] = React.useState(0);
  
  // Auto slide كل 3 ثواني
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);
  
  
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-header">
          <h1>EXPRESSIVE</h1>
          <h2><em>TIMELESS</em> ELEGANT</h2>
        </div>
        <div className="hero-gallery">
  {images.map((src, index) => (
    <div
      key={index}
      className={`hero-image-container ${index === currentSlide ? 'current' : ''} ${index === activeImage ? 'zoomed' : ''}`}
      onClick={() => setActiveImage(index === activeImage ? null : index)}
    >
      <img src={src} alt={`Look ${index + 1}`} className="hero-image" />
    </div>
  ))}
</div>


      </section>

      {/* About Section */}
      <div className="about-side">
        <div className="about-images">
          {bodyShapes.map((shape, index) => (
    <div key={index} className="circle-image">
      <img 
        src={`/images/${shape.type}.jpg`} 
        alt={shape.type} 
        className="circle-image-img"
      />
      <div className="circle-image-content">
        <h1>{shape.type}</h1>
        <h2>{shape.description}</h2>
      </div>
    </div>
  ))}
        </div>
      </div>

      {/* Body Shapes Section */}
      <div className="shapes-section">
        <h1 className="main-title">מצאי את הסגנון המושלם שלך</h1>
        <p className="subtitle">בחרי את מבנה הגוף שלך לגילוי המלצות אופנה מותאמות אישית</p>

        <div className="shape-selector">
          {bodyShapes.map((shape, index) => (
            <div key={index} className="shape-item">
              <div className="shape-content">
                <div className="shape-svg-container">
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      d={getShapePath(shape.type)} 
                      stroke="white" 
                      strokeWidth="2" 
                    />
                  </svg>
                </div>
                <div className="shape-info">
                  <h2>{shape.type}</h2>
                  <p>{shape.description}</p>
                  <Link to="/products" className="view-products-btn">
                    View Products
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-section brand-section">
              <h3>H&Y מודה</h3>
              <p>אופנה מותאמת אישית לכל מבנה גוף</p>
              <div className="social-links">
                <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                <a href="#" aria-label="Pinterest"><i className="fab fa-pinterest"></i></a>
              </div>
            </div>

            <div className="footer-section">
              <h3>הקולקציות שלנו</h3>
              <div className="footer-shapes-grid">
                {bodyShapes.map((shape, index) => (
                  <Link key={index} to="/products" className="footer-shape-item">
                    <span className="shape-name">{shape.type}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-section">
              <h3>שירות לקוחות</h3>
              <ul className="footer-links">
                <li><Link to="/sizing">מדריך מידות</Link></li>
                <li><Link to="/shipping">משלוחים והחזרות</Link></li>
                <li><Link to="/contact">צור קשר</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>המעל</h3>
              <div className="newsletter-signup">
                <p>הצטרפי לרשימת התפוצה שלנו לעדכונים ומבצעים</p>
                <div className="email-signup">
                  <input type="email" placeholder="הכניסי את האימייל שלך" />
                  <button className="signup-btn">הרשמה</button>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-info">
              <p>כל הזכויות שמורות &copy; 2024 H&Y מודה</p>
              <div className="footer-legal">
                <Link to="/privacy">מדיניות פרטיות</Link>
                <span className="separator">|</span>
                <Link to="/terms">תנאי שימוש</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;