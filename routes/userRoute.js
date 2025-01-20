const express = require('express');
const {
  spareVehicle,
  notifications,
  uploadController,
  getDocuments,
  getPaymentHistory,
  getVehicle,
  checkKycApprovals,
  checkVehicleAllocApprovals,
  checkSpareApprovals,
  rentRequest,
  rentVehicles,
  approvedVehicle,
  addDriver,
  addAdmin,
  updatePasswordforadmin,
  getDashboardData,
  switchUserStatus,
  fetchAllDrivers,
  getDriverPaymentHistory,
  getAllocatedVehicles,
  exportAllData,
  deleteDriver,
  exportDrivers
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadFields } = require('../middleware/multer');
const validateRequest = require('../middleware/validateRequest');
const { addDriverSchema, addAdminSchema, updatePasswordSchema, dashboardSchema, getAllDriversSchema, switchUserStatusSchema, validateDriverIdParam } = require('../validations/userValidations');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.post('/rent-request', authMiddleware, rentRequest);
router.post('/spare', authMiddleware, spareVehicle);
router.get('/notifications', authMiddleware, notifications);
router.post('/uploads', uploadFields, authMiddleware, uploadController);
router.get('/getDocuments', authMiddleware, getDocuments);
router.get('/payments', authMiddleware, getPaymentHistory);
router.get('/getVehicle', authMiddleware, getVehicle);
router.get('/kycapprovals', authMiddleware, checkKycApprovals);
router.get('/vehicleapprovals', authMiddleware, checkVehicleAllocApprovals);
router.get('/spareapprovals', authMiddleware, checkSpareApprovals);
router.post('/rent', authMiddleware, rentVehicles);
router.get('/approved-vehicle', authMiddleware, approvedVehicle);


/**
 * @swagger
 * /v1/user/add-driver:
 *   post:
 *     summary: Add a new driver to the system.
 *     description: Adds a new driver with the provided details, including KYC files. The KYC files are uploaded to S3, and the driver's data is saved to the database.
 *     tags:
 *       - Driver
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the driver.
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 description: The phone number of the driver. It should be a 12-digit number starting with 91.
 *                 example: "919876543210"
 *               locationId:
 *                 type: string
 *                 description: The location ID where the driver will be based.
 *                 example: "64fa3a17dabc1f00012345ef"
 *               vehicleId:
 *                 type: string
 *                 description: The vehicle ID the driver will be associated with (optional).
 *                 example: "64fa3a17dabc1f00012345gh"
 *               userPhoto:
 *                 type: string
 *                 format: binary
 *                 description: The driver's profile photo (required).
 *               aadharCard:
 *                 type: string
 *                 format: binary
 *                 description: The driver's Aadhar card (required).
 *               panCard:
 *                 type: string
 *                 format: binary
 *                 description: The driver's PAN card (required).
 *               driversLicense:
 *                 type: string
 *                 format: binary
 *                 description: The driver's license (required).
 *     responses:
 *       '201':
 *         description: Driver added successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Driver added successfully"
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 name: "John Doe"
 *                 phone: "919876543210"
 *                 locationId: "64fa3a17dabc1f00012345ef"
 *                 vehicleId: "64fa3a17dabc1f00012345gh"
 *       '400':
 *         description: Bad Request - Missing or invalid files or data.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Missing required files: userPhoto, aadharCard, panCard, driversLicense"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post('/add-driver', checkPermission('ADD_DRIVER'), validateRequest(addDriverSchema), addDriver);

/**
 * @swagger
 * /v1/admin/add-admin:
 *   post:
 *     summary: Add a new admin to the system.
 *     description: Allows a SuperAdmin to add a new admin by providing the required details. Only users with the SuperAdmin role can access this endpoint.
 *     tags:
 *       - Admin
 *       - Web App
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the admin.
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the admin.
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 description: The password for the admin account.
 *                 example: "Admin@123"
 *               locationId:
 *                 type: string
 *                 description: The location ID the admin will manage.
 *                 example: "64fa3a17dabc1f00012345ef"
 *     responses:
 *       '201':
 *         description: Admin added successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Admin added successfully"
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 name: "Jane Smith"
 *                 email: "admin@example.com"
 *                 role: "ADMIN"
 *                 locationId: "64fa3a17dabc1f00012345ef"
 *       '400':
 *         description: Bad Request - Missing or invalid data.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Validation error: email is required"
 *       '403':
 *         description: Forbidden - User lacks permission.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Permission denied"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post('/add-admin', checkPermission('ADD_ADMIN'), validateRequest(addAdminSchema), addAdmin);

/**
 * @swagger
 * /v1/user/update-admin-password:
 *   post:
 *     summary: Update the password for an admin.
 *     description: Allows an admin to update their password by providing the old password and the new password. The request must include both the old password and the new password.
 *     tags:
 *       - Admin
 *       - Web App
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: The current password of the admin.
 *                 example: "Admin@123"
 *               newPassword:
 *                 type: string
 *                 description: The new password the admin wants to set.
 *                 example: "NewAdmin@123"
 *     responses:
 *       '200':
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Password updated successfully."
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 name: "Jane Smith"
 *                 email: "admin@example.com"
 *       '400':
 *         description: Bad Request - Validation error or incorrect old password.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Old password is incorrect."
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post('/update-admin-password', validateRequest(updatePasswordSchema), updatePasswordforadmin);


/**
 * @swagger
 * /v1/user/dashboard:
 *   get:
 *     summary: Retrieve dashboard statistics.
 *     description: Provides statistics for payments, drivers, vehicles, and other relevant metrics. 
 *                  Filters can be applied based on location ID.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter statistics by location ID. If not provided, defaults to the logged-in user's location.
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard statistics.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Dashboard statistics retrieved successfully."
 *               data:
 *                 paymentReceived: 150000
 *                 driverCount: 120
 *                 totalVehicles: 300
 *                 activeVehicles: 250
 *                 inactiveVehicles: 20
 *                 spareVehicles: 10
 *                 underRepairVehicles: 20
 *                 twoWheelerCount: 100
 *                 fourWheelerCount: 200
 *       400:
 *         description: Validation error for query parameters.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Validation error"
 *               details:
 *                 - "locationId must be a valid string"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error occurred while fetching dashboard statistics."
 */
router.get('/dashboard', checkPermission('GET_DASHBOARD'), validateRequest(dashboardSchema), getDashboardData);

/**
 * @swagger
 * /v1/user/switch-status/{id}:
 *   put:
 *     summary: Switch the user's active status.
 *     description: |
 *       This endpoint allows you to update a user's `isActive` status. 
 *       The status is passed in the request body as a boolean value (`true` or `false`).
 *       When you set the status to `true`, the user becomes active. Setting it to `false` deactivates the user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user whose status you want to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: boolean
 *                 description: |
 *                   The new `isActive` status of the user. 
 *                   `true` makes the user active, `false` deactivates the user.
 *                 example: true
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Successfully updated the user's status.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "User status updated successfully."
 *               data:
 *                 _id: "6739961a50b40337c8a72616"
 *                 phone: "911010101010"
 *                 role: "Driver"
 *                 isActive: true
 *                 name: "rpm"
 *                 locationId: null
 *       400:
 *         description: Invalid request body or missing `status` field.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid status value. It must be a boolean."
 *       404:
 *         description: User not found. The user with the provided `id` could not be found in the database.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "User not found."
 *       500:
 *         description: Internal server error. This could be due to issues such as database errors or server-side issues.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.put('/switch-status/:id', checkPermission('SWITCH_STATUS'), validateRequest(switchUserStatusSchema), switchUserStatus);

/**
 * @swagger
 * /v1/user/get-all-drivers:
 *   get:
 *     summary: Fetch a paginated list of drivers with optional filters.
 *     description: |
 *       Retrieves a list of drivers filtered by `status` (isActive) and/or `locationId`. 
 *       Each driver includes details and the latest processed vehicle request's `vehicleNumber`, 
 *       if available, or `null` if no vehicle is allotted.
 *     tags:
 *       - Driver
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         required: false
 *         description: Filter drivers by active status (`true` for active, `false` for inactive).
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter the records by a search term, which can match against the driver's name, or phone number.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination. Defaults to 1.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of drivers per page. Defaults to 10.
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter drivers by a specific location ID.
 *     responses:
 *       200:
 *         description: Successfully fetched drivers.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Drivers fetched successfully."
 *               data:
 *                 drivers:
 *                   - _id: "driverId123"
 *                     name: "John Doe"
 *                     isActive: true
 *                     locationId:
 *                       _id: "locationId123"
 *                       cityName: "Bangalore"
 *                     vehicleAlloted: "KA01AB1234"
 *                   - _id: "driverId124"
 *                     name: "Jane Smith"
 *                     isActive: false
 *                     locationId:
 *                       _id: "locationId124"
 *                       cityName: "Mumbai"
 *                     vehicleAlloted: null
 *                 total: 50
 *                 page: 1
 *                 limit: 10
 *       400:
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid query parameters."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Failed to fetch drivers."
 */
router.get('/get-all-drivers', checkPermission('GET_ALL_DRIVERS'), validateRequest(getAllDriversSchema), fetchAllDrivers);

/**
 * @swagger
 * /v1/user/get-payment-history/{id}:
 *   get:
 *     summary: Fetch payment history for a specific driver.
 *     description: Retrieves a list of payment history for a driver based on the driver ID. Includes details like payment amount, transaction ID, status, and date range.
 *     tags:
 *       - Driver
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the driver whose payment history is being fetched.
 *         schema:
 *           type: string
 *           example: "driverId123"
 *     responses:
 *       200:
 *         description: Successfully fetched payment history.
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
 *                   example: "Payment history fetched successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       dateRange:
 *                         type: object
 *                         properties:
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-12-20T00:00:00.000Z"
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-12-25T00:00:00.000Z"
 *                       _id:
 *                         type: string
 *                         example: "67549fae857bf5c6da681ac4"
 *                       driverId:
 *                         type: string
 *                         example: "673745eb90405dae00e6edfc"
 *                       vehicleType:
 *                         type: string
 *                         example: "3-wheeler (10)"
 *                       status:
 *                         type: string
 *                         example: "processed"
 *                       requestType:
 *                         type: string
 *                         example: "primary"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-12-07T19:19:10.335Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-12-07T19:19:10.335Z"
 *                       __v:
 *                         type: integer
 *                         example: 0
 *                       paymentId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64f763a0a3b4f21a5a9c9d01"
 *                           amount:
 *                             type: integer
 *                             example: 1400
 *                           transactionId:
 *                             type: string
 *                             example: "TX4567890"
 *                       vehicleId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "67389d726320a264a3920826"
 *                           vehicleType:
 *                             type: string
 *                             example: "3-wheeler (10)"
 *                           vehicleNumber:
 *                             type: string
 *                             example: "XYZ7890"
 *       400:
 *         description: Invalid driver ID or query parameters.
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
 *                   example: "Invalid driver ID or query parameters."
 *       404:
 *         description: Driver not found.
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
 *                   example: "Driver not found."
 *       500:
 *         description: Internal server error.
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
 *                   example: "Failed to fetch payment history."
 */
router.get('/get-payment-history/:id', checkPermission('GET_PAYMENT_HISTORY') , getDriverPaymentHistory);

/**
 * @swagger
 * /v1/user/get-allocated-vehicles/{userId}:
 *   get:
 *     summary: Retrieve allocated primary and spare vehicles for a specific driver.
 *     description: Fetches details of primary and spare vehicles allocated to a driver, including payment details and vehicle information.
 *     tags:
 *       - Driver
 *       - Vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user (driver) whose allocated vehicles are being fetched.
 *         schema:
 *           type: string
 *           example: "userId123"
 *     responses:
 *       200:
 *         description: Successfully retrieved allocated vehicles.
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
 *                   example: "Alloted Vehicles retrieved successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     primary:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         dateRange:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-12-20T00:00:00.000Z"
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-12-25T00:00:00.000Z"
 *                         _id:
 *                           type: string
 *                           example: "67549fae857bf5c6da681ac4"
 *                         driverId:
 *                           type: string
 *                           example: "673745eb90405dae00e6edfc"
 *                         vehicleType:
 *                           type: string
 *                           example: "3-wheeler (10)"
 *                         status:
 *                           type: string
 *                           example: "processed"
 *                         requestType:
 *                           type: string
 *                           example: "primary"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-12-16T19:19:10.335Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-12-07T19:19:10.335Z"
 *                         paymentId:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "64f763a0a3b4f21a5a9c9d01"
 *                             amount:
 *                               type: integer
 *                               example: 1400
 *                             transactionId:
 *                               type: string
 *                               example: "TX4567890"
 *                         vehicleId:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "67389d726320a264a3920826"
 *                             vehicleType:
 *                               type: string
 *                               example: "3-wheeler (10)"
 *                             vehicleNumber:
 *                               type: string
 *                               example: "XYZ7890"
 *                     spare:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         dateRange:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-12-20T00:00:00.000Z"
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-12-25T00:00:00.000Z"
 *                         _id:
 *                           type: string
 *                           example: "67549fae857bf5c6da681ac5"
 *                         driverId:
 *                           type: string
 *                           example: "673745eb90405dae00e6edfc"
 *                         vehicleType:
 *                           type: string
 *                           example: "3-wheeler (10)"
 *                         status:
 *                           type: string
 *                           example: "processed"
 *                         requestType:
 *                           type: string
 *                           example: "spare"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-12-17T19:19:10.335Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-12-07T19:19:10.335Z"
 *                         paymentId:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "64f763a0a3b4f21a5a9c9d01"
 *                             amount:
 *                               type: integer
 *                               example: 1400
 *                             transactionId:
 *                               type: string
 *                               example: "TX4567890"
 *                         vehicleId:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "67389d726320a264a3920826"
 *                             vehicleType:
 *                               type: string
 *                               example: "3-wheeler (10)"
 *                             vehicleNumber:
 *                               type: string
 *                               example: "XYZ7890"
 *       400:
 *         description: Invalid user ID or query parameters.
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
 *                   example: "Invalid user ID or query parameters."
 *       404:
 *         description: User or vehicles not found.
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
 *                   example: "User or vehicles not found."
 *       500:
 *         description: Internal server error.
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
 *                   example: "Internal server error."
 */
router.get('/get-allocated-vehicles/:userId', checkPermission('GET_ALLOTED_VEHICLES'), getAllocatedVehicles);

/**
 * @swagger
 * /v1/user/export-all:
 *   get:
 *     summary: Export all data.
 *     description: Fetches and exports all relevant data from the system, including users, their associated vehicle requests, payments, and vehicles.
 *     tags:
 *       - Export
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully exported all data.
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
 *                   example: "Data exported successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "-"
 *                       phone:
 *                         type: string
 *                         example: "917878787811"
 *                       role:
 *                         type: string
 *                         example: "Driver"
 *                       isActive:
 *                         type: boolean
 *                         example: false
 *                       locationId:
 *                         type: string
 *                         example: "-"
 *                       vehicleRequests:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             dateRange:
 *                               type: object
 *                               properties:
 *                                 startDate:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2024-12-20T00:00:00.000Z"
 *                                 endDate:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2024-12-25T00:00:00.000Z"
 *                             vehicleType:
 *                               type: string
 *                               example: "3-wheeler (10)"
 *                             status:
 *                               type: string
 *                               example: "processed"
 *                             requestType:
 *                               type: string
 *                               example: "primary"
 *                             paymentId:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: integer
 *                                   example: 1400
 *                                 transactionId:
 *                                   type: string
 *                                   example: "TX4567890"
 *                                 status:
 *                                   type: string
 *                                   example: "completed"
 *                                 date:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2024-06-14T00:00:00.000Z"
 *                             vehicleId:
 *                               type: object
 *                               properties:
 *                                 vehicleNumber:
 *                                   type: string
 *                                   example: "XYZ7890"
 *                                 rentalValue:
 *                                   type: number
 *                                   example: 600
 *                                 status:
 *                                   type: string
 *                                   example: "inactive"
 *       400:
 *         description: Invalid request parameters.
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
 *                   example: "Invalid request parameters."
 *       404:
 *         description: No data found for export.
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
 *                   example: "No data found for export."
 *       500:
 *         description: Internal server error.
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
 *                   example: "Internal server error."
 */
router.get('/export-all', checkPermission('GET_EXPORTED_DATA') , exportAllData);

/**
 * @swagger
 * /v1/user/delete-driver/{driverId}:
 *   delete:
 *     summary: Delete a driver by their ID.
 *     description: Deletes a driver from the system based on the provided driver ID. If the driver is not found, an error is returned.
 *     tags:
 *       - Driver
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         description: The ID of the driver to delete.
 *         schema:
 *           type: string
 *           example: "64f763a0a3b4f21a5a9c9d01"
 *     responses:
 *       200:
 *         description: Driver successfully deleted.
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
 *                   example: "Driver deleted successfully."
 *                   data: []
 *       400:
 *         description: Invalid driver ID format.
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
 *                   example: "Invalid driver ID format."
 *       404:
 *         description: Driver not found.
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
 *                   example: "Error deleting driver: Driver not found"
 *       500:
 *         description: Internal server error.
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
 *                   example: "Internal server error."
 */
router.delete('/delete-driver/:driverId', checkPermission('DELETE_DRIVER'), deleteDriver);

/**
 * @swagger
 * /v1/user/export-drivers:
 *   get:
 *     summary: Export a list of drivers.
 *     description: Fetches a list of drivers based on the user's location or a specified location. Returns details about the drivers and their associated vehicles.
 *     tags:
 *       - Driver
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         description: The ID of the location to filter drivers (optional). If not provided, defaults to the user's location or "Bangalore".
 *         schema:
 *           type: string
 *           example: "64f763a0a3b4f21a5a9c9d01"
 *     responses:
 *       200:
 *         description: Drivers successfully exported.
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
 *                   example: "Drivers exported successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     drivers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Name of driver:
 *                             type: string
 *                             example: "Rishi"
 *                           Account status:
 *                             type: boolean
 *                             example: true
 *                           Contact no.:
 *                             type: string
 *                             example: "927639007331"
 *                           Vehicle allotted:
 *                             type: string
 *                             example: "KA 8C 454456"
 *                           Vehicle type:
 *                             type: string
 *                             example: "2-wheeler"
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     message:
 *                       type: string
 *                       example: "Drivers exported successfully."
 *       400:
 *         description: Bad request or invalid parameters.
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
 *                   example: "Invalid location ID."
 *       404:
 *         description: Location not found.
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
 *                   example: "Bangalore location not found."
 *       500:
 *         description: Internal server error.
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
 *                   example: "Internal server error."
 */
router.get('/export-drivers', checkPermission('GET_EXPORTED_DATA'), validateRequest(validateDriverIdParam) ,exportDrivers);

module.exports = router;
