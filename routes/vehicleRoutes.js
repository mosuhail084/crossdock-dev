const express = require('express');
const { addVehicle } = require('../controllers/vehicleController');
const validateRequest = require('../middleware/validateRequest.js');
const { addVehicleSchema } = require('../validations/vehicleValidations');

const router = express.Router();

/**
 * @swagger
 * /v1/vehicle/add:
 *   post:
 *     summary: Add a new vehicle to the system.
 *     description: Adds a new vehicle to the system with details like type, number, rental value, and associated location. Only authorized users can access this endpoint.
 *     tags:
 *       - Vehicle
 *       - Web App
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: ['2-wheeler', '3-wheeler (5.8)', '3-wheeler (10)', '4-wheeler']
 *                 description: The type of the vehicle.
 *               vehicleNumber:
 *                 type: string
 *                 description: The unique registration number of the vehicle.
 *               rentalValue:
 *                 type: number
 *                 format: float
 *                 description: The rental value for the vehicle per day.
 *               locationID:
 *                 type: string
 *                 description: The ID of the location to which the vehicle belongs.
 *               status:
 *                 type: string
 *                 enum: ['underRepair', 'active', 'inactive', 'spare']
 *                 description: The status of the vehicle. Defaults to 'inactive'.
 *             example:
 *               vehicleType: "4-wheeler"
 *               vehicleNumber: "MH12AB1234"
 *               rentalValue: 1000.0
 *               locationID: "64fa3a17dabc1f00012345ef"
 *               status: "active"
 *     responses:
 *       '201':
 *         description: Vehicle added successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicle added successfully"
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 vehicleType: "4-wheeler"
 *                 vehicleNumber: "MH12AB1234"
 *                 rentalValue: 1000.0
 *                 locationID: "64fa3a17dabc1f00012345ef"
 *                 status: "active"
 *       '400':
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Validation error: Vehicle number already exists"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post('/add', validateRequest(addVehicleSchema), addVehicle);

module.exports = router;