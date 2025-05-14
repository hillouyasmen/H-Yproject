import React from "react";
import "../styles/About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1>About H&Y MODA</h1>
      
      <section className="about-section">
        <div className="about-content">
          <h2>Our Story</h2>
          <p>
            Founded in 2023, H&Y MODA was born from a passion for fashion and a desire to create 
            clothing that celebrates individuality and style. Our journey began with a simple idea: 
            to provide high-quality, trendy fashion that makes everyone feel confident and beautiful.
          </p>
          <p>
            Today, we're proud to offer a diverse range of collections that cater to different body types, 
            occasions, and personal styles. Our commitment to quality and customer satisfaction remains 
            at the heart of everything we do.
          </p>
        </div>
        <div className="about-image">
          <img src="/images/about-store.jpg" alt="H&Y MODA Store" />
        </div>
      </section>
      
      <section className="about-section reverse">
        <div className="about-content">
          <h2>Our Mission</h2>
          <p>
            At H&Y MODA, our mission is to empower individuals through fashion. We believe that 
            clothing is more than just fabric—it's a form of self-expression and confidence.
          </p>
          <p>
            We're committed to creating sustainable, ethical fashion that not only looks good but 
            also feels good to wear and good to buy. Our designs are created with care, attention 
            to detail, and respect for our planet.
          </p>
        </div>
        <div className="about-image">
          <img src="/images/about-team.jpg" alt="H&Y MODA Team" />
        </div>
      </section>
    </div>
  );
};

export default About;
