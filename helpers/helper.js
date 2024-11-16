/**
 * Capitalize the first character of every word in a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - The formatted string with each word capitalized.
 */
const capitalizeWords = (str) => {
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

module.exports = { capitalizeWords };