const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user.
 * @param {object} user - The user object.
 * @returns {string} - The JWT token.
 */
exports.generateJwtToken = (user) => {
    return jwt.sign(
        { userId: user._id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};