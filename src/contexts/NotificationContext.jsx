import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationTimeout, setValidationTimeout] = useState(null);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const showError = useCallback((message, duration) => {
    return addNotification(message, 'error', duration);
  }, [addNotification]);

  const showWarning = useCallback((message, duration) => {
    return addNotification(message, 'warning', duration);
  }, [addNotification]);

  const showInfo = useCallback((message, duration) => {
    return addNotification(message, 'info', duration);
  }, [addNotification]);

  const showValidationErrors = useCallback((errorsObject) => {
    // Clear any existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Convert errors object to array of field names
    const errorFields = Object.keys(errorsObject).map(key => {
      // Capitalize first letter and format field name
      return errorsObject[key] || key.charAt(0).toUpperCase() + key.slice(1);
    });

    setValidationErrors(errorFields);

    // Auto-clear after 6 seconds
    const timeout = setTimeout(() => {
      setValidationErrors([]);
    }, 6000);

    setValidationTimeout(timeout);
  }, [validationTimeout]);

  const clearValidationErrors = useCallback(() => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    setValidationErrors([]);
    setValidationTimeout(null);
  }, [validationTimeout]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    validationErrors,
    showValidationErrors,
    clearValidationErrors
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
