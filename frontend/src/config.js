// Base API URL
export const API_URL = 'http://localhost:4001/api';

// Use this in components instead of hardcoding the URL
export const getApiUrl = (endpoint) => `${API_URL}${endpoint}`;

