const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5001/api';

async function testOrdersAPI() {
  try {
    // First, log in to get a token
    console.log('🔑 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'testuser',  // Replace with a valid username
      password: 'password123'  // Replace with the correct password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    
    // Get user ID from the token or user data
    const userId = loginResponse.data.user?.id || 1; // Fallback to 1 if not available
    
    // Test getting user orders
    console.log('\n🛒 Fetching user orders...');
    const ordersResponse = await axios.get(`${API_URL}/orders/user/${userId}?includeItems=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ User orders:');
    console.log(JSON.stringify(ordersResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOrdersAPI();
