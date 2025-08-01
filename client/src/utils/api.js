// API utility functions with CORS support
const API_BASE_URL = 'http://localhost:5001/api';

// Create a custom fetch function with default options
const customFetch = async (url, options = {}) => {
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
    mode: 'cors',
  };

  console.log(`API Request: ${config.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, config);
    console.log(`API Response [${response.status}]:`, response);
    
    // For DELETE requests that might not return content
    if (response.status === 204) {
      return { success: true };
    }

    // Check content type for JSON responses
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { data: text };
    }
    
    // Handle non-2xx responses
    if (!response.ok) {
      const error = new Error(responseData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.response = responseData;
      throw error;
    }
    
    return responseData;
  } catch (error) {
    console.error('API Request Failed:', {
      url,
      method: options.method || 'GET',
      error: error.message,
      status: error.status,
      response: error.response,
    });
    
    // Enhance error with more context
    const enhancedError = new Error(error.message || 'Network request failed');
    enhancedError.status = error.status;
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Fetches data from the API with consistent error handling
 * @param {string} endpoint - The API endpoint (e.g., '/products')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} - The parsed JSON response
 */
export const fetchApi = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching from: ${url}`, { options });
    
    const response = await customFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('API Response:', response);
    
    // If the response has a success flag, return it as is
    if (response && typeof response.success !== 'undefined') {
      return response;
    }
    
    // If the response is an array or object, wrap it in a success response
    if (response !== null && typeof response === 'object') {
      return { success: true, ...response };
    }
    
    // For any other case, wrap it in a success response with data
    return { success: true, data: response };
  } catch (error) {
    console.error('API Error:', {
      endpoint,
      error: error.message,
      status: error.status,
      response: error.response,
    });
    
    // Ensure we always return a consistent error format
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      status: error.status,
      response: error.response,
      data: null
    };
    
    console.error('API Error Response:', errorResponse);
    return errorResponse;
  }
};

// Example usage:
// const { data } = await fetchApi('/items');
// const result = await fetchApi('/checkout', { method: 'POST', body: JSON.stringify(order) });
