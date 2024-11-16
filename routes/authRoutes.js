const express = require('express');
const router = express.Router();
const { requestOtp, signupDriver, loginDriver, loginAdmin} = require('../controllers/authController');
const validatePhone = require('../middleware/validatePhone');
const validateRequest = require('../middleware/validateRequest');
const { loginDriverSchema, signupDriverSchema, requestOtpSchema, loginAdminSchema } = require('../validations/authValidations');


/**
 * @swagger
 * /v1/request-otp:
 *   post:
 *     summary: Request an OTP for phone number verification.
 *     description: Generate and send a One-Time Password (OTP) to the provided phone number. This endpoint is used for both user registration and login.
 *     tags:
 *       - Authentication
 *       - Mobile App
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The phone number to which the OTP will be sent. Must be a valid 12-digit number starting with 91.
 *             example:
 *               phone: "919876543210"
 *     responses:
 *       '200':
 *         description: OTP sent successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "OTP sent successfully"
 *               data: null
 *       '400':
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid phone number"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Failed to send OTP"
 */
router.post('/request-otp', validateRequest(requestOtpSchema), requestOtp);

/**
 * @swagger
 * /v1/signup:
 *   post:
 *     summary: Sign up a new driver using phone and OTP.
 *     description: Creates a new driver account after verifying the OTP. If OTP is invalid, registration will fail.
 *     tags:
 *       - Authentication
 *       - Mobile App
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the driver.
 *               phone:
 *                 type: string
 *                 description: The phone number of the driver.
 *               otp:
 *                 type: string
 *                 description: One-Time Password for verification.
 *             example:
 *               name: "John Doe"
 *               phone: "919876543210"
 *               otp: "123456"
 *     responses:
 *       '200':
 *         description: Driver registered successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Driver registered successfully"
 *               token: "JWT_TOKEN"
 *               user:
 *                 id: "614c1f4f4f5c5b3d0e9a3c3b"
 *                 name: "John Doe"
 *                 phone: "919876543210"
 *                 role: "Driver"
 *       '400':
 *         description: Invalid request or OTP.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid OTP"
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post('/signup', validateRequest(signupDriverSchema), signupDriver);

/**
 * @swagger
 * /v1/login-driver:
 *   post:
 *     summary: Driver login with OTP.
 *     description: Allows a driver to log in using their phone number and OTP.
 *     tags:
 *       - Authentication
 *       - Mobile App
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Driver's phone number.
 *               otp:
 *                 type: string
 *                 description: OTP received on the phone.
 *           example:
 *             phone: "919876543210"
 *             otp: "123456"
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   _id: "64b05c33eaf91b2d6f4e8dc8"
 *                   name: "John Doe"
 *                   phone: "919876543210"
 *                   role: "Driver"
 *                 token: "jwt-token-here"
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Driver not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/login-driver', validateRequest(loginDriverSchema), loginDriver);

/**
 * @swagger
 * /v1/login-admin:
 *   post:
 *     summary: Login for Admin and SuperAdmin.
 *     description: Allows Admin and SuperAdmin to log in using their email and password. Returns a JWT token upon successful login.
 *     tags:
 *       - Authentication
 *       - Web App
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the user.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password of the user.
 *           example:
 *             email: "admin@example.com"
 *             password: "Admin@123"
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The unique ID of the user.
 *                       example: "64b0ed8d1ffb0ba72dc2fe5"
 *                     name:
 *                       type: string
 *                       description: The name of the user.
 *                       example: "Admin User"
 *                     email:
 *                       type: string
 *                       description: The email of the user.
 *                       example: "admin@example.com"
 *                     role:
 *                       type: string
 *                       description: The role of the user.
 *                       enum:
 *                         - Admin
 *                         - SuperAdmin
 *                       example: "Admin"
 *       400:
 *         description: Bad Request - Missing or invalid fields in the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         description: The name of the field with an error.
 *                         example: "email"
 *                       message:
 *                         type: string
 *                         description: The validation error message.
 *                         example: "Email is required"
 *       401:
 *         description: Unauthorized - Invalid credentials provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       403:
 *         description: Forbidden - User does not have the required role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied. Only Admin and SuperAdmin can log in here."
 *       404:
 *         description: Not Found - User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/login-admin', validateRequest(loginAdminSchema), loginAdmin);

module.exports = router;