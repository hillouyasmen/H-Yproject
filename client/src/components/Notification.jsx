import React, { useEffect, useRef } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaTimes 
} from 'react-icons/fa';
import PropTypes from 'prop-types';
import '../styles/Notification.css';

const Notification = ({ notification, onClose }) => {
  const progressRef = useRef(null);
  const { message, type = 'info', duration = 5000 } = notification || {};

  // Handle progress bar animation
  useEffect(() => {
    if (!message || duration <= 0) return;
    
    const progress = progressRef.current;
    if (progress) {
      progress.style.animationDuration = `${duration}ms`;
      progress.style.animationPlayState = 'running';
    }
    
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon" />;
      case 'error':
        return <FaExclamationCircle className="notification-icon" />;
      case 'warning':
        return <FaExclamationTriangle className="notification-icon" />;
      case 'info':
      default:
        return <FaInfoCircle className="notification-icon" />;
    }
  };

  return (
    <div className={`notification ${type}`} role="alert" aria-live="assertive">
      <div className="notification-content">
        <div className="notification-icon-wrapper">
          {getIcon()}
        </div>
        <div className="notification-message">
          <span>{message}</span>
        </div>
        <button 
          onClick={onClose} 
          className="notification-close" 
          aria-label="Close notification"
        >
          <FaTimes />
        </button>
      </div>
      {duration > 0 && (
        <div 
          ref={progressRef} 
          className="notification-progress"
          style={{
            animationDuration: `${duration}ms`,
            animationPlayState: 'running'
          }}
        />
      )}
    </div>
  );
};

Notification.propTypes = {
  notification: PropTypes.shape({
    message: PropTypes.string,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    duration: PropTypes.number
  }),
  onClose: PropTypes.func.isRequired
};

export default Notification;
