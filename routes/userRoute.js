const express = require('express');
const {
  signupController,
  loginController,
  sendOtp,
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
  addDriver
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadFields } = require('../middleware/multer');
const validateRequest = require('../middleware/validateRequest');
const { addDriverSchema } = require('../validations/userValidations');
const { validateKycFiles } = require('../middleware/uploadKycFiles');

const router = express.Router();

router.post('/signup', signupController);
router.post('/send-otp', sendOtp); // Keep this one
router.post('/login', loginController);
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
router.post('/add-driver', validateKycFiles, validateRequest(addDriverSchema), addDriver);

module.exports = router;
