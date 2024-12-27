const { ROLES } = require('../config/constants');
const User = require('../models/userModel');
const { createError } = require('../utils/errorUtils');
const { generateJwtToken } = require('../utils/jwtUtils');
const { verifyOtp, verifyOtpforadmin } = require('./otpService');
const bcrypt = require('bcrypt');

/**
 * Find a user by phone number.
 * @param {string} phone - The phone number to search for.
 * @returns {Promise<Object|null>} - The user if found, null if not.
 */
const findUserByPhone = async (phone) => {
    return await User.findOne({ phone });
};

/**
 * Register a new driver or update the existing driver's name.
 * @param {object} data - The driver data (phone, name).
 * @returns {Promise<object>} - Returns the created/updated user and JWT token.
 * @throws {Error} - Throws an error if the driver is already active with the given phone number.
 */
exports.registerDriver = async ({ phone, name }) => {
    let user = await findUserByPhone(phone);

    if (user) {
        if (user.isActive) {
            const error = new Error('A user with this phone number is already active');
            error.statusCode = 409;
            throw error;
        }

        user.name = name;
        user.isActive = true;
        await user.save();
    } else {
        user = new User({ phone, name, role: ROLES.DRIVER, isActive: true });
        await user.save();
    }

    const token = generateJwtToken(user);
    return { user, token };
};

/**
 * Service for driver login.
 * @param {string} phone - The phone number of the driver.
 * @param {string} otp - The OTP provided by the driver.
 * @returns {Promise<{ user: object, token: string }>} - User object and JWT token.
 */
exports.loginDriverService = async (phone, otp) => {
    const user = await User.findOne({ phone, role: ROLES.DRIVER, isActive: true });

    if (!user) {
        const error = new Error('User not found or Inactive');
        error.statusCode = 404;
        throw error;
    }

    const isOtpValid = await verifyOtp(phone, otp);
    if (!isOtpValid) {
        const error = new Error('Invalid OTP');
        error.statusCode = 400;
        throw error;
    }

    const token = generateJwtToken(user);
    return { user, token };
};

/**
 * Handle login logic for Admin and SuperAdmin roles.
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<Object>} - Returns user object and JWT token if successful.
 * @throws {Error} - Throws error if user not found or invalid credentials.
 */
exports.loginAdminService = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        createError('User not found', 404);
    }
    if (!['Admin', 'SuperAdmin'].includes(user.role)) {
        createError('Access denied. Only Admin and SuperAdmin can log in here.', 403);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        createError('Invalid credentials', 401);
    }

    const token = generateJwtToken(user);

    return { user, token };
};

/**
 * Service for handling password reset for Admin and SuperAdmin.
 * This function verifies the OTP, checks its validity and expiration, and updates the user's password in the database.
 * 
 * @param {string} phone - The phone number of the admin or superadmin.
 * @param {string} password - The new password that the admin wants to set.
 * @param {string} otp - The OTP provided by the user for verification.
 * @throws {Error} - Throws an error if the OTP is invalid, expired, or if the user is not found.
 * @returns {Promise<void>} - Returns nothing if the password is successfully updated.
 */
exports.forgotPasswordforadmin = async (phone, password, otp) => {
    try {
        const isOtpValid = await verifyOtpforadmin(phone, otp);
        
        if (!isOtpValid) {
            throw new Error("Invalid OTP.");
        }
        const user = await User.findOne({ phone, role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] } });
        if (!user) {
            throw new Error("User not found or incorrect credentials.");
        }
        const isOtp = user.otp == otp;
        const isOtpExpired = new Date() > user.otpExpiry;
        if (!isOtp) {
            throw new Error("Invalid OTP");
        }

        if (isOtpExpired) {
            throw new Error("OTP has expired");
        }

        if (!user) {
            throw new Error("User not found.");
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
    } catch (error) {
        throw new Error("Error updating password: " + error.message);
    }
};