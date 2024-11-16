/**
 * Middleware to validate the request body for login-driver.
 * @param {object} schema - Joi schema for validation.
 * @returns {function} - Express middleware.
 */
const validateRequest = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    next();
};

module.exports = validateRequest;