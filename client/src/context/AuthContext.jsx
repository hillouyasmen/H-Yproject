import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '../utils/api';

const AuthContext = createContext(null);

// Create a separate component for the provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if we have a token and it's not expired
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Optional: Add token expiration check here if you have expiration in your tokens
        return true;
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Check for existing session on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Optional: Verify token with backend
          // const response = await fetchApi('/users/me');
          // if (!response.success) throw new Error('Invalid session');
          
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No valid session found
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Handle successful authentication
  const handleAuthSuccess = useCallback((userData) => {
    try {
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setAuthError(null);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Error during authentication:', error);
      setAuthError('Failed to complete authentication. Please try again.');
      return false;
    }
  }, []);

  // Handle logout
  const logout = useCallback(() => {
    try {
      // Clear in-memory state
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      navigate('/login');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }, [navigate]);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetchApi('/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('Login response:', response);

      if (!response || !response.success) {
        throw new Error(response?.message || 'Invalid response from server');
      }

      // Extract token and user data from response
      const { token, ...userData } = response;
      
      if (!token) {
        throw new Error('No authentication token received');
      }
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update auth state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Ensure role has a default value
      const userRole = userData.role || 'user';
      
      // Redirect based on role
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // Navigate to the intended URL or home
        navigate(from, { replace: true });
      }
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Basic validation
      if (!userData.username || !userData.password || !userData.fullName || !userData.email) {
        throw new Error('All fields are required');
      }

      // Call the register endpoint
      const response = await fetchApi('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      // Show success message
      setAuthError('Registration successful! You can now log in.');
      
      // Return the response data
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to update user data in the auth context
  const updateUser = useCallback((userData) => {
    try {
      // Update in-memory state
      setUser(prev => ({
        ...prev,
        ...userData
      }));
      
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    updateUser,
    login,
    register,
    logout,
    setAuthError
  };

  if (isLoading) {
    return <div>טוען...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the context and provider
export { AuthProvider };

// Export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher Order Component for protecting routes
export const withAuth = (Component) => {
  const WrappedComponent = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        navigate('/login', { state: { from: location } });
      }
    }, [isLoading, isAuthenticated, navigate, location]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? <Component {...props} /> : null;
  };
  
  return WrappedComponent;
};
export default AuthContext;
