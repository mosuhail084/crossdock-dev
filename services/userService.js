const User = require('../models/userModel');

/**
 * Create a new user.
 * @param {Object} userData - Data for the new user.
 * @returns {Promise<Object>} - Created user.
 */
exports.createUser = async (userData) => {
    const user = new User(userData);
    await user.save();
    return user;
};
