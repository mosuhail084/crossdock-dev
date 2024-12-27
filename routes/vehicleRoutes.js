const express = require('express');
const { addVehicle, createRentRequestController, allocateVehicle, getInactiveVehicles, getAllVehicleRequests, deleteVehicle, editVehicle, getAllVehicles } = require('../controllers/vehicleController');
const validateRequest = require('../middleware/validateRequest.js');
const { addVehicleSchema, createRentRequestSchema, allocateVehicleSchema, fetchInactiveVehiclesSchema, fetchVehicleRequestsSchema } = require('../validations/vehicleValidations');
const { checkPermission } = require('../middleware/checkPermission.js');

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
 *               locationId:
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
 *               locationId: "64fa3a17dabc1f00012345ef"
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
 *                 locationId: "64fa3a17dabc1f00012345ef"
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
router.post('/add', checkPermission('ADD_VEHICLE'), validateRequest(addVehicleSchema), addVehicle);

/**
 * @swagger
 * /v1/vehicle/rent-request:
 *   post:
 *     summary: Create a rent request.
 *     description: Allows a driver to create a rent request for a specific vehicle type.
 *     tags:
 *       - Vehicle
 *       - Mobile App
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [2-wheeler, 3-wheeler (5.8), 3-wheeler (10), 4-wheeler]
 *                 description: The type of vehicle being requested.
 *                 example: "2-wheeler"
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date
 *                     description: The starting date for the rental request.
 *                     example: "2024-11-20"
 *                   endDate:
 *                     type: string
 *                     format: date
 *                     description: The ending date for the rental request.
 *                     example: "2024-11-25"
 *             required:
 *               - vehicleType
 *               - dateRange
 *           example:
 *             vehicleType: "2-wheeler"
 *             dateRange:
 *               startDate: "2024-11-20"
 *               endDate: "2024-11-25"
 *     responses:
 *       201:
 *         description: Rent request created successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Rent request created successfully."
 *               data:
 *                 requestId: "64fa3a17dabc1f00012345ef"
 *                 driverId: "64fa3a17dabc1f00012345aa"
 *                 vehicleType: "2-wheeler"
 *                 dateRange:
 *                   startDate: "2024-11-20"
 *                   endDate: "2024-11-25"
 *                 requestType: "primary"
 *                 status: "pending"
 *       400:
 *         description: Validation error for the request body.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Validation error"
 *               details:
 *                 - "vehicleType must be one of [2-wheeler, 3-wheeler (5.8), 3-wheeler (10), 4-wheeler]"
 *                 - "dateRange.startDate is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post(
    '/rent-request',
    checkPermission('CREATE_RENT_REQUEST'),
    validateRequest(createRentRequestSchema),
    createRentRequestController
);

/**
 * @swagger
 * /v1/vehicle/allocate:
 *   post:
 *     summary: Allocate a vehicle to a pending rent request.
 *     description: Assigns a vehicle to a rent request and updates its status to "approved".
 *     tags:
 *       - Vehicle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rentRequestId:
 *                 type: string
 *                 description: ID of the rent request.
 *                 example: "64fa3a17dabc1f00012345ef"
 *               vehicleId:
 *                 type: string
 *                 description: ID of the vehicle to allocate.
 *                 example: "64fa3a17dabc1f00012345gh"
 *     responses:
 *       200:
 *         description: Vehicle allocated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicle allocated successfully."
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 driverId: "64fa3a17dabc1f00012345aa"
 *                 vehicleId: "64fa3a17dabc1f00012345gh"
 *                 vehicleType: "2-wheeler"
 *                 status: "approved"
 *                 dateRange:
 *                   startDate: "2024-11-20T00:00:00.000Z"
 *                   endDate: "2024-11-25T00:00:00.000Z"
 *       400:
 *         description: Validation error or request not in pending state.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Rent request is not in a pending state."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.post(
    '/allocate',
    checkPermission('ALLOCATE_VEHICLE'),
    validateRequest(allocateVehicleSchema),
    allocateVehicle
);

/**
 * @swagger
 * /v1/vehicle/inactive:
 *   get:
 *     summary: Fetch inactive vehicles based on vehicle type, vehicle number, and pagination.
 *     description: Retrieve a list of inactive vehicles with optional filters and pagination.
 *     tags:
 *       - Vehicle
 *     parameters:
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [2-wheeler, 3-wheeler (5.8), 3-wheeler (10), 4-wheeler]
 *         description: Filter inactive vehicles by vehicle type.
 *       - in: query
 *         name: vehicleNumber
 *         schema:
 *           type: string
 *         description: Search for vehicles by vehicle number (case-insensitive).
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter inactive vehicles by location ID.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination. Default is 1.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of vehicles per page. Default is 10. Maximum is 100.
 *     responses:
 *       200:
 *         description: A paginated list of inactive vehicles.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Inactive vehicles retrieved successfully."
 *               data:
 *                 total: 20
 *                 page: 1
 *                 limit: 10
 *                 vehicles:
 *                   - _id: "64fa3a17dabc1f00012345ef"
 *                     vehicleNumber: "KA-1234"
 *                     vehicleType: "2-wheeler"
 *                     status: "inactive"
 *                     locationId: "64fa3a17dabc1f00012345aa"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get(
    '/inactive',
    checkPermission('FETCH_INACTIVE_VEHICLES'),
    validateRequest(fetchInactiveVehiclesSchema),
    getInactiveVehicles
);

/**
 * @swagger
 * /v1/vehicle/all-requests:
 *   get:
 *     summary: Fetch all vehicle requests with filters and pagination.
 *     description: Retrieve all vehicle requests with optional filters for status, vehicle type, and pagination.
 *     tags:
 *       - Vehicle Requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter vehicle requests by status. Default is "pending".
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [2-wheeler, 3-wheeler (5.8), 3-wheeler (10), 4-wheeler]
 *         description: Filter vehicle requests by vehicle type.
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter vehicle requests by location ID.
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [primary, spare]
 *         description: Filter vehicle requests by request type.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination. Default is 1.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of vehicle requests per page. Default is 10.
 *     responses:
 *       200:
 *         description: A paginated list of vehicle requests.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicle requests retrieved successfully."
 *               data:
 *                 total: 30
 *                 page: 1
 *                 limit: 10
 *                 vehicleRequests:
 *                   - _id: "64fa3a17dabc1f00012345ef"
 *                     driverId: "64fa3a17dabc1f00012345aa"
 *                     vehicleId: "64fa3a17dabc1f00012345ab"
 *                     vehicleType: "2-wheeler"
 *                     status: "pending"
 *                     locationId: "64fa3a17dabc1f00012345cc"
 *                     dateRange:
 *                       startDate: "2023-11-01"
 *                       endDate: "2023-11-15"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get(
    '/all-requests',
    checkPermission('GET_ALL_VEHICLE_REQUESTS'),
    validateRequest(fetchVehicleRequestsSchema),
    getAllVehicleRequests);

/**
 * @swagger
 * /v1/vehicle/get-all-vehicles:
 *   get:
 *     summary: Get a list of all vehicles.
 *     description: Retrieve a list of all vehicles in the system with optional filters and pagination.
 *     tags:
 *       - Vehicle
 *     parameters:
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [2-wheeler, 3-wheeler (5.8), 3-wheeler (10), 4-wheeler]
 *         description: Filter vehicles by vehicle type.
 *       - in: query
 *         name: vehicleNumber
 *         schema:
 *           type: string
 *         description: Search for vehicles by vehicle number (case-insensitive).
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter vehicles by location ID.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination. Default is 1.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of vehicles per page. Default is 10. Maximum is 100.
 *     responses:
 *       200:
 *         description: A paginated list of all vehicles.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicles retrieved successfully."
 *               data:
 *                 total: 20
 *                 page: 1
 *                 limit: 10
 *                 vehicles:
 *                   - _id: "64fa3a17dabc1f00012345ef"
 *                     vehicleNumber: "KA-1234"
 *                     vehicleType: "2-wheeler"
 *                     status: "active"
 *                     locationId: "64fa3a17dabc1f00012345aa"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get(
    '/get-all-vehicles',
    checkPermission('GET_ALL_VEHICLES'),
    validateRequest(fetchVehicleRequestsSchema),
    getAllVehicles);

/**
 * @swagger
 * /v1/vehicle/edit/{vehicleId}:
 *   put:
 *     summary: Edit an existing vehicle's details.
 *     description: Edits the details of an existing vehicle by its ID. Only authorized users can access this endpoint.
 *     tags:
 *       - Vehicle
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the vehicle to update.
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
 *               locationId:
 *                 type: string
 *                 description: The ID of the location to which the vehicle belongs.
 *               status:
 *                 type: string
 *                 enum: ['underRepair', 'active', 'inactive', 'spare']
 *                 description: The status of the vehicle.
 *             example:
 *               vehicleType: "4-wheeler"
 *               vehicleNumber: "MH12AB1234"
 *               rentalValue: 1200.0
 *               locationId: "64fa3a17dabc1f00012345ef"
 *               status: "active"
 *     responses:
 *       200:
 *         description: Vehicle updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicle updated successfully."
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 vehicleType: "4-wheeler"
 *                 vehicleNumber: "MH12AB1234"
 *                 rentalValue: 1200.0
 *                 locationId: "64fa3a17dabc1f00012345ef"
 *                 status: "active"
 *       400:
 *         description: Bad request due to validation or duplicate data.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Validation error: Vehicle number already exists."
 *       404:
 *         description: Vehicle not found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Vehicle not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.put(
    '/edit/:vehicleId',
    checkPermission('EDIT_VEHICLE'),
    validateRequest(addVehicleSchema),
    editVehicle);

/**
 * @swagger
 * /v1/vehicle/delete/{vehicleId}:
 *   delete:
 *     summary: Delete a vehicle from the system.
 *     description: Deletes a vehicle by its ID. Only authorized users can access this endpoint.
 *     tags:
 *       - Vehicle
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the vehicle to delete.
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicle deleted successfully."
 *       404:
 *         description: Vehicle not found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Vehicle not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.delete(
    '/delete/:vehicleId',
    checkPermission('DELETE_VEHICLE'),
    deleteVehicle);

module.exports = router;