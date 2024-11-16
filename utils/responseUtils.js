/**
 * Returns a success response object with the given data and message
 * @param {Object} data Data to be sent in the response
 * @param {String} [message='Success'] Response message
 * @returns {Object} Response object with success, message, and data properties
 */
const successResponse = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data,
    };
};

/**
 * Returns an error response object with the given message
 * @param {String} message Error message to be sent in the response
 * @returns {Object} Response object with success, message, and data properties
 */
const errorResponse = (message) => {
    return {
        success: false,
        message,
        data: [],
    };
};

module.exports = {
    successResponse,
    errorResponse,
};
