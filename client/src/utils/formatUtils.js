/**
 * Formats a string by replacing underscores with spaces and capitalizing each word
 * @param {string} str - The string to format (e.g., 'inverted_triangle')
 * @returns {string} Formatted string (e.g., 'Inverted Triangle')
 */
export const formatShapeName = (str) => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Reverts a formatted string back to the database format
 * @param {string} str - The formatted string (e.g., 'Inverted Triangle')
 * @returns {string} Database format string (e.g., 'inverted_triangle')
 */
export const toDatabaseShapeFormat = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\s+/g, '_');
};
