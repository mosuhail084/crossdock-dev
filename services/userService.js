const User = require('../models/userModel');
const Location = require('../models/locationModel');
const bcrypt = require('bcrypt');
const { ROLES } = require('../config/constants');

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

/**
 * Service to add a new Admin.
 * @param {object} adminData - Admin details (email, password, name, locationId).
 * @returns {Promise<object>} - The newly created Admin user.
 * @throws {Error} - Throws an error if email is already in use or locationId is invalid.
 */
exports.createAdmin = async ({ email, password, name, locationId }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('Email is already in use');
        error.statusCode = 400;
        throw error;
    }

    const location = await Location.findById(locationId);
    if (!location) {
        const error = new Error('Invalid Location ID');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        email,
        password: hashedPassword,
        name,
        role: ROLES.ADMIN,
        locationID: locationId,
        isActive: true,
    });

    return await newUser.save();
};
