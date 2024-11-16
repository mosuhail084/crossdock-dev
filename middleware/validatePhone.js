// middlewares/validatePhone.js

const { errorResponse } = require('../utils/responseUtils');

/**
 * Validates the phone number in the request body.
 * Ensures the phone number is a non-empty 10-digit string.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const validatePhone = (req, res, next) => {
    const { phone: phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json(errorResponse('Phone number is required'));
    }

    const phonePattern = /^91\d{10}$/;
    if (!phonePattern.test(phoneNumber)) {
        return res.status(400).json(errorResponse('Invalid phone number format. Must be a 12-digit number starting with 91.'));
    }

    next();
};

module.exports = validatePhone;
