import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const summerCollection = [
  {
    id: "dresses",
    title: "Summer Dresses",
    image: "images/dress1.jpg",
    link: "/shop/dresses",
  },
  {
    id: "tops",
    title: "Summer Tops",
    image: "images/tops2.jpg",
    link: "/shop/tops",
  },
  {
    id: "beachwear",
    title: "Beachwear",
    image: "images/beachware.jpg",
    link: "/shop/beachwear",
  },
];

const bodyTypes = [
  {
    type: "hourglass",
    image: "images/hour.png",
    title: "Hourglass",
    description: "Balanced bust and hips with a defined waist.",
  },
  {
    type: "pear",
    image: "images/צילום מסך 2025-04-18 234904.png",
    title: "Pear",
    description: "Narrow shoulders and fuller hips.",
  },
  {
    type: "apple",
    image: "images/apple.png",
    title: "Apple",
    description: "Fuller bust and midsection with slender legs.",
  },
  {
    type: "rectangle",
    image: "images/regtangle.png",
    title: "Rectangle",
    description: "Balanced proportions with little waist definition.",
  },
];

const Home = () => (
  <div className="home-container">
    <section className="hero-banner">
      <video autoPlay muted loop className="hero-video">
        <source src="images/video2.mp4" type="video/mp4" />
      </video>
      <div className="hero-content">
        <h1>NEW SEASON</h1>
        <Link to="/shop" className="hero-link">
          Shop Now
        </Link>
      </div>
    </section>

    <section className="summer-categories">
      <h2>Summer Collection</h2>
      <div className="category-grid">
        {summerCollection.map(({ id, title, image, link }) => (
          <Link key={id} to={link} className="category-item">
            <img src={image} alt={title} />
            <h3>{title}</h3>
          </Link>
        ))}
      </div>
    </section>

    <section className="body-types-section">
      <h2>Shop by Body Type</h2>
      <div className="body-types-grid">
        {bodyTypes.map(({ type, image, title, description }) => (
          <Link key={type} to={`/bodytype/${type}`} className="body-type-card">
            <img src={image} alt={title} />
            <h3>{title}</h3>
            <p>{description}</p>
          </Link>
        ))}
      </div>
    </section>

    <section className="newsletter-section">
      <h2>Join Our Newsletter</h2>
      <form className="newsletter-form">
        <input type="email" placeholder="Your email address" />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  </div>
);

export default Home;
