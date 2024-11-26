/**
 * Middleware to validate the request body for login-driver.
 * @param {object} schema - Joi schema for validation.
 * @returns {function} - Express middleware.
 */
const validateRequest = (schema) => (req, res, next) => {
    const { error } = schema.validate(
        {
            body: req.body,
            query: req.query,
            files: req.files
        },
        { abortEarly: false }
    );

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details.map((detail) => detail.message).join(', '),
        });
    }

    next();
};

module.exports = validateRequest;