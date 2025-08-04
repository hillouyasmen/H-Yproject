// Simple notification service that logs to console
const sendOrderConfirmation = async (order, userEmail) => {
  try {
    console.log(`📧 Order confirmation for ${userEmail}`);
    console.log('📦 Order details:', JSON.stringify(order, null, 2));
    return { success: true, message: 'Order confirmation logged to console' };
  } catch (error) {
    console.error('❌ Error in sendOrderConfirmation:', error);
    return { success: false, error: error.message };
  }
};

// Export the function
module.exports = {
  sendOrderConfirmation
};
