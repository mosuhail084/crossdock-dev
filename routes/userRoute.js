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
  addAdmin
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadFields } = require('../middleware/multer');
const validateRequest = require('../middleware/validateRequest');
const { addDriverSchema, addAdminSchema } = require('../validations/userValidations');
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

module.exports = router;
