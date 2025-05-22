import React, { useState } from 'react';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      await axios.post('http://localhost:5000/api/contact', formData);
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
    }
  };

  return (
    <div className="contact-container">
      <h1>צור קשר</h1>
      <div className="contact-content">
        <div className="contact-info">
          <h2>מידע ליצירת קשר</h2>
          <div className="info-item">
            <i className="fas fa-map-marker-alt"></i>
            <p>רחוב הרצל 123, תל אביב</p>
          </div>
          <div className="info-item">
            <i className="fas fa-phone"></i>
            <p>054-1234567</p>
          </div>
          <div className="info-item">
            <i className="fas fa-envelope"></i>
            <p>info@hymoda.com</p>
          </div>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">שם מלא:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">אימייל:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">נושא:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">הודעה:</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={status === 'sending'}>
            {status === 'sending' ? 'שולח...' : 'שלח הודעה'}
          </button>

          {status === 'success' && (
            <div className="success-message">
              ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.
            </div>
          )}

          {status === 'error' && (
            <div className="error-message">
              אירעה שגיאה בשליחת ההודעה. אנא נסה שוב מאוחר יותר.
            </div>
          )}
        </form>
      </div>

      <div className="map-container">
        <iframe
          title="מפת המיקום שלנו"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3381.5825666124!2d34.7818!3d32.0853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDA1JzA3LjEiTiAzNMKwNDYnNTQuNSJF!5e0!3m2!1sen!2sil!4v1625764428548!5m2!1sen!2sil"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
};

export default Contact;
