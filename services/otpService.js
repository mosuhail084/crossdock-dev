const axios = require('axios'); // Import axios
const User = require('../models/userModel.js');
const { generateOtp } = require('../utils/otpUtils.js');
const { ROLES } = require('../config/constants.js');

/**
 * Sends the OTP to the user's phone number via MSG91 API.
 * @param {number|string} to - The phone number of the user.
 * @param {string} otp - The One Time Password to be sent.
 * @returns {Promise<void>} - Resolves when the OTP is sent successfully.
 */
const sendOtpToPhone = async (to, otp) => {
    try {
        const options = {
            method: 'POST',
            url: 'https://control.msg91.com/api/v5/otp',
            headers: { 'Content-Type': 'application/json' },
            params: {
                template_id: process.env.TEMPLATEID,
                mobile: to,
                authkey: process.env.APIKEY,
                otp: otp,
            },
            data: {
                Param1: "value1",
                Param2: "value2",
                Param3: "value3",
            },
        };

        const response = await axios.request(options);
        console.log('OTP sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending OTP:', error.response ? error.response.data : error.message);
        throw new Error('Failed to send OTP');
    }
};

/**
 * Requests an OTP for a given phone number and updates the user's OTP or creates a new user.
 * @param {string|number} phoneNumber - The phone number of the user.
 * @returns {Promise<string>} - Returns the OTP that was generated.
 */
exports.requestOtp = async (phoneNumber) => {
    try {
        const user = await User.findOne({ phone: phoneNumber, role: ROLES.DRIVER });

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + process.env.OTP_EXPIRY * 60000);

        if (!user) {
            const newUser = new User({
                phone: phoneNumber,
                otp,
                otpExpiry,
                role: ROLES.DRIVER
            });
            await newUser.save();
        } else {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
        }

        await sendOtpToPhone(phoneNumber, otp);
        return otp;
    } catch (error) {
        console.error('Error while generating OTP:', error);
        throw error;
    }
};

/**
 * Verifies the OTP for the given phone number.
 * @param {string} phoneNumber - The phone number to verify the OTP against.
 * @param {string} otp - The OTP to verify.
 * @returns {Promise<boolean>} - Resolves to true if the OTP is valid, otherwise false.
 */
exports.verifyOtp = async (phoneNumber, otp) => {
    try {
        const user = await User.findOne({ phone: phoneNumber });
        
        if (user && user.otp === otp && new Date() < user.otpExpiry) {
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error verifying OTP:', err);
        throw err;
    }
};