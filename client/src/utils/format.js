/**
 * Safely formats a monetary amount
 * @param {any} amount - The amount to format (can be number, string, or other)
 * @returns {string} Formatted currency string (e.g., "$12.34")
 */
export const formatCurrency = (amount) => {
  try {
    // Handle null/undefined
    if (amount == null) return '$0.00';
    
    // Convert to number
    const num = Number(amount);
    
    // Check if it's a valid number
    if (isNaN(num)) {
      console.warn('Invalid amount value:', amount);
      return '$0.00';
    }
    
    // Format with 2 decimal places
    return `$${num.toFixed(2)}`;
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '$0.00';
  }
};

export default {
  formatCurrency
};
