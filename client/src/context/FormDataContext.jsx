import React, { createContext, useState, useContext, useCallback } from 'react';

const FormDataContext = createContext(null);

export const FormDataProvider = ({ children }) => {
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  // Add a new form submission
  const addFormSubmission = useCallback((submission) => {
    const timestamp = new Date().toISOString();
    setFormSubmissions(prev => [
      ...prev, 
      { ...submission, id: Date.now(), timestamp }
    ]);
  }, []);

  // Sort form submissions
  const sortSubmissions = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Get sorted submissions
  const getSortedSubmissions = useCallback(() => {
    const sortableItems = [...formSubmissions];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [formSubmissions, sortConfig]);

  const value = {
    formSubmissions,
    addFormSubmission,
    sortSubmissions,
    getSortedSubmissions,
    sortConfig
  };

  return (
    <FormDataContext.Provider value={value}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};

export default FormDataContext;
