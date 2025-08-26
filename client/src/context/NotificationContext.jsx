import React, { createContext, useState, useCallback, useMemo, useContext } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

/**
 * Notification Provider Component
 * Manages global notifications throughout the app
 */
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    // If there's an existing notification, clear its timeout
    if (notification?.timeoutId) {
      clearTimeout(notification.timeoutId);
    }

    // Set a new timeout for auto-hiding
    let timeoutId = null;
    if (duration && duration > 0) {
      timeoutId = setTimeout(hideNotification, duration);
    }

    setNotification({ 
      message, 
      type,
      timeoutId,
      duration
    });
  }, [notification, hideNotification]);

  // Helper methods for different notification types
  const showSuccess = useCallback((message, duration = 5000) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration = 5000) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration = 3000) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration = 4000) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  // Clear timeout when component unmounts
  React.useEffect(() => {
    return () => {
      if (notification?.timeoutId) {
        clearTimeout(notification.timeoutId);
      }
    };
  }, [notification]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }), [
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notification && (
        <Notification 
          notification={notification} 
          onClose={hideNotification} 
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
