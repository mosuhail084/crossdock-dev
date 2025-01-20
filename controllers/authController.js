const { successResponse, errorResponse } = require('../utils/responseUtils');
const otpService = require('../services/otpService');
const { registerDriver, loginDriverService, loginAdminService, forgotPasswordforadmin} = require('../services/authService');

/**
 * Handles OTP request for a user's phone number.
 * Extracts the phone number from the request body, requests an OTP using the otpService,
 * and sends a success response if successful. Sends an error response if any error occurs.
 * 
 * @param {Object} req - Express request object containing the phone number in the body.
 * @param {Object} res - Express response object for sending the response.
 */
exports.requestOtp = async (req, res) => {
    const { phone } = req.body;
    try {
        const otp = await otpService.requestOtp(phone);
        res.status(200).json(successResponse({ otp }, 'OTP sent successfully'));
    } catch (error) {
        console.error('Error requesting OTP:', error);
        res.status(error.statusCode || 500).json(errorResponse(error.message || 'Failed to request OTP'));
    }
};

/**
 * Handles OTP request for an Admin's phone number.
 * Extracts the phone number from the request body, requests an OTP using the otpService,
 * and sends a success response if successful. Sends an error response if any error occurs.
 * 
 * @param {Object} req - Express request object containing the phone number in the body.
 * @param {Object} res - Express response object for sending the response.
 */
exports.requestOtpforadmin = async (req, res) => {
    const { phone } = req.body;
    try {
        const otp = await otpService.requestOtpforadmin(phone);
        res.status(200).json(successResponse({ otp }, 'OTP sent successfully'));
    } catch (error) {
        console.error('Error requesting OTP for Admin:', error);
        res.status(error.statusCode || 500).json(errorResponse(error.message || 'Failed to request OTP'));
    }
};


  /**
 * Admin forgot password flow.
 * Updates the password of the Admin after verifying OTP.
 * 
 * @param {Object} req - Express request object containing phone and new password.
 * @param {Object} res - Express response object for sending the response.
 */
  exports.forgotPasswordforadmin = async (req, res) => {
    try {
      const { phone, password, otp } = req.body;
      await forgotPasswordforadmin(phone, password,otp);
      return res.status(200).json(successResponse([],'Password updated successfully.'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(errorResponse(error.message || 'Something Went Wrong'));
    }
  };

/**
 * Controller for signing up a driver.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.signupDriver = async (req, res) => {
    const { phone, name, otp } = req.body;

    try {
        const isOtpValid = await otpService.verifyOtp(phone, otp);
        if (!isOtpValid) {
            return res.status(400).json(errorResponse('Invalid OTP'));
        }

        const { user, token } = await registerDriver({ phone, name });
        res.status(200).json(successResponse({ user, token }, 'Signup successful'));
    } catch (error) {
        console.error('Error during driver signup:', error);
        res.status(500).json(errorResponse(error.message || 'Internal server error'));
    }
};

/**
 * Controller for driver login.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.loginDriver = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        if (!phone || !otp) {
            return res.status(400).json(errorResponse('Phone and OTP are required'));
        }

        const { user, token } = await loginDriverService(phone, otp);
        return res.status(200).json(successResponse({ user, token }, 'Login successful'));
    } catch (error) {
        console.error('Error in loginDriver:', error.message);
        return res.status(error.statusCode || 500).json(errorResponse(error.message || 'Internal server error'));
    }
};

/**
 * Admin and SuperAdmin login controller.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { user, token } = await loginAdminService(email, password);

        return res.status(200).json(
            successResponse(
                { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, locationId: user.locationId?._id, locationName: user.locationId?.cityName } },
                'Login successful'
            )
        );
    } catch (error) {
        return res.status(error.statusCode || 500).json(errorResponse(error.message || 'Internal server error'));
    }
};
