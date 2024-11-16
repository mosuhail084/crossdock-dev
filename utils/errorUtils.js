/**
 * Create a custom error with status code.
 * @param {string} message - The error message.
 * @param {number} statusCode - The status code.
 * @throws {Error} - A custom error with message and status code.
 */
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode || 500;
    throw error;
};

module.exports = {
    createError,
};
