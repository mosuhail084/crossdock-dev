const express = require('express');
const { addVehicle, createRentRequestController, allocateVehicle, getInactiveVehicles, getAllVehicleRequests, deleteVehicle, editVehicle, getAllVehicles, exportPrimaryVehicleRequest, exportSpareVehicleRequest,exportAllVehiclesWithUser, getAllVehiclesWithUser, requestSpareVehicle, getAllSpareVehicleRequests, allocateSpareVehicle, disableVehicle, vehicleRequestStatus, exportAllVehicles } = require('../controllers/vehicleController');
const validateRequest = require('../middleware/validateRequest.js');
const { addVehicleSchema, createRentRequestSchema, allocateVehicleSchema, fetchInactiveVehiclesSchema, fetchVehicleRequestsSchema, fetchVehicleswithuserSchema, disableVehicleSchema } = require('../validations/vehicleValidations');
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
    validateRequest(fetchVehicleswithuserSchema),
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

/**
 * @swagger
 * /v1/vehicle/export-primary-vehilce-request:
 *   get:
 *     summary: Export primary vehicle requests.
 *     description: Exports the vehicle requests that are in a pending status, along with the driver details (name, contact) and vehicle information (vehicle type, vehicle number).
 *     tags:
 *       - Vehicle
 *       - Web App
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The optional location ID to filter vehicle requests. If not provided, defaults to the user's location.
 *     responses:
 *       200:
 *         description: Primary vehicle requests data retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Primary Vehicle Requests data retrieved successfully."
 *               data:
 *                 - Name of driver: "John Doe"
 *                   Contact no.: "1234567890"
 *                   Date of request: "2024-12-28T15:30:00Z"
 *                   Vehicle type: "3-wheeler (10)"
 *                   Vehicle number: "KA-01-1234"
 *                 - Name of driver: "Jane Smith"
 *                   Contact no.: "0987654321"
 *                   Date of request: "2024-12-28T16:00:00Z"
 *                   Vehicle type: "2-wheeler"
 *                   Vehicle number: "KA-02-5678"
 *       400:
 *         description: Invalid location ID format.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid location ID format."
 *       404:
 *         description: No primary vehicle requests found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No primary vehicle requests found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/export-primary-vehilce-request', checkPermission('GET_EXPORTED_DATA') , exportPrimaryVehicleRequest);

/**
 * @swagger
 * /v1/vehicle/export-spare-vehilce-request:
 *   get:
 *     summary: Export spare vehicle requests.
 *     description: Exports the spare vehicle requests that are in a pending status, along with the driver details (name, contact) and vehicle information (vehicle type, vehicle number). It also includes the primary vehicle information if available.
 *     tags:
 *       - Vehicle
 *       - Web App
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The optional location ID to filter spare vehicle requests. If not provided, defaults to the user's location.
 *     responses:
 *       200:
 *         description: Spare vehicle requests data retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Spare Vehicle Requests data retrieved successfully."
 *               data:
 *                 - Name of driver: "John Doe"
 *                   Contact no.: "1234567890"
 *                   Date of request: "2024-12-28T15:30:00Z"
 *                   Vehicle type: "3-wheeler"
 *                   Primary vehicle: "KA-01-1234"
 *                   Spare vehicle: "KA-01-5678"
 *                 - Name of driver: "Jane Smith"
 *                   Contact no.: "0987654321"
 *                   Date of request: "2024-12-28T16:00:00Z"
 *                   Vehicle type: "2-wheeler"
 *                   Primary vehicle: "KA-02-6789"
 *                   Spare vehicle: "KA-02-5678"
 *       400:
 *         description: Invalid location ID format.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid location ID format."
 *       404:
 *         description: No spare vehicle requests found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No spare vehicle requests found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/export-spare-vehilce-request', checkPermission('GET_EXPORTED_DATA') , exportSpareVehicleRequest);

/**
 * @swagger
 * /v1/vehicle/export-all-vehicles-with-users:
 *   get:
 *     summary: Export all allocated vehicle requests.
 *     description: Retrieves a list of all allocated vehicle requests, including details about the vehicle, driver, allocation date, and rental information. Only vehicles that have been allocated are included.
 *     tags:
 *       - Vehicle
 *       - Web App
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The optional location ID to filter vehicles. If not provided, defaults to the user's location.
 *     responses:
 *       200:
 *         description: Vehicle requests retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Exported all vehicles successfully."
 *               data:
 *                 - Vehicle Number: "KA 8C 1234"
 *                   Vehicle Type: "2-wheeler"
 *                   Status: "active"
 *                   Driver Name: "John Doe"
 *                   Driver Contact No.: "9876543210"
 *                   Allocation Date: "2024-06-10T08:00:00.000Z"
 *                   Paid Till Date: "2024-06-20T08:00:00.000Z"
 *                   Rental Value: 1500
 *                 - Vehicle Number: "KA 9A 5678"
 *                   Vehicle Type: "4-wheeler"
 *                   Status: "inactive"
 *                   Driver Name: "Jane Smith"
 *                   Driver Contact No.: "9876549876"
 *                   Allocation Date: "2024-06-12T08:00:00.000Z"
 *                   Paid Till Date: "2024-06-22T08:00:00.000Z"
 *                   Rental Value: 2000
 *       400:
 *         description: Invalid location ID format.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid location ID format."
 *       404:
 *         description: No vehicle requests found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No vehicle requests found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/export-all-vehicles-with-users', checkPermission('GET_EXPORTED_DATA') , exportAllVehiclesWithUser);

/**
 * @swagger
 * /v1/vehicle/get-all-vehicle-with-users:
 *   get:
 *     summary: Retrieve all vehicles with their request details.
 *     description: Fetches a paginated list of all vehicles with details about their allocation, driver, and rental information. If no request data is available for a vehicle, the fields will be returned as null.
 *     tags:
 *       - Vehicle
 *       - Web App
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The optional location ID to filter vehicles. If not provided, defaults to the user's location.
 *       - in: query
 *         name: vehicleType
 *         required: false
 *         schema:
 *           type: string
 *         description: The type of vehicle to filter by (e.g., "2-wheeler", "4-wheeler").
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter the records by a search term, which can match against the vehicle number, driver's name, or phone number.
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: The status of the vehicle to filter by (e.g., "active", "inactive").
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page for pagination.
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicles retrieved successfully."
 *               data:
 *                 result:
 *                   - Vehicle Number: "KA 01 AB 1234"
 *                     Vehicle Type: "4-wheeler"
 *                     Status: "active"
 *                     Driver Name: "John Doe"
 *                     Driver Contact No.: "9876543210"
 *                     Allocation Date: "2024-06-10T08:00:00.000Z"
 *                     Paid Till Date: "2024-06-20T08:00:00.000Z"
 *                     Rental Value: 5000
 *                   - Vehicle Number: "KA 02 CD 5678"
 *                     Vehicle Type: "2-wheeler"
 *                     Status: "inactive"
 *                     Driver Name: null
 *                     Driver Contact No.: null
 *                     Allocation Date: null
 *                     Paid Till Date: null
 *                     Rental Value: 2000
 *                 total: 2
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *       400:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid query parameters."
 *       404:
 *         description: No vehicles found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No vehicles found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/get-all-vehicle-with-users', checkPermission('GET_ALL_VEHICLES_WITH_USER') ,validateRequest(fetchVehicleswithuserSchema), getAllVehiclesWithUser);

/**
 * @swagger
 * /v1/vehicle/request-spare-vehicle:
 *   post:
 *     summary: Request a spare vehicle.
 *     description: Allows a user to request a spare vehicle if they have an active vehicle request. 
 *                  Requires the `REQUEST_SPARE_VEHICLE` permission.
 *     tags:
 *       - Vehicle
 *       - Web App
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *             required: []
 *     responses:
 *       200:
 *         description: Spare vehicle request processed successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Spare vehicle request successful."
 *               data:
 *                 driverId: "675c614b8a2aa5a6541430b9"
 *                 locationId: "676c6628e6023ca2a0c731d9"
 *                 paymentId: "64f763a0a3b4f21a5a9c9d01"
 *                 vehicleType: "2-wheeler"
 *                 status: "pending"
 *                 dateRange:
 *                   startDate: "2024-12-20T00:00:00.000Z"
 *                   endDate: "2025-01-05T00:00:00.000Z"
 *                 requestType: "spare"
 *                 _id: "6773b7523bbbbdcabdbc8e1b"
 *                 createdAt: "2024-12-31T09:20:18.840Z"
 *                 updatedAt: "2024-12-31T09:20:18.840Z"
 *                 __v: 0
 *       400:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid request parameters."
 *       401:
 *         description: Unauthorized. The user is not authenticated.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Authentication required."
 *       403:
 *         description: Forbidden. The user lacks the required `REQUEST_SPARE_VEHICLE` permission.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Permission denied."
 *       404:
 *         description: No active request found for the driver.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No active vehicle request found. Cannot create a spare request."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.post('/request-spare-vehicle', checkPermission('REQUEST_SPARE_VEHICLE') , requestSpareVehicle);

/**
 * @swagger
 * /v1/vehicle/get-status:
 *   get:
 *     summary: Get the status of vehicle requests for the authenticated user
 *     tags:
 *       - Vehicle
 *       - Mobile App
 *     description: Retrieve the status of both primary and spare vehicle requests for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle request statuses fetched successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Vehicle request status fetched successful."
 *               data:
 *                 - reqType: "PRIMARY"
 *                   status: "active"
 *                 - reqType: "SPARE"
 *                   status: "inactive"
 *       400:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid request parameters."
 *       401:
 *         description: Unauthorized. The user is not authenticated.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Authentication required."
 *       403:
 *         description: Forbidden. The user lacks the required `VEHICLE_REQUEST_STATUS` permission.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Permission denied."
 *       404:
 *         description: No vehicle requests found for the authenticated user.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No vehicle requests found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/get-status', checkPermission('VEHICLE_REQUEST_STATUS') , vehicleRequestStatus);

/**
 * @swagger
 * /v1/vehicle/get-all-spare-vehicle-requests:
 *   get:
 *     summary: Get all spare vehicle requests
 *     tags:
 *       - Vehicle
 *       - Web App
 *     description: Retrieve all spare vehicle requests with optional pagination and filtering by vehicle type.
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: The location ID to filter requests.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter the records by a search term, which can match against the driver's name, or phone number.
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *         description: The type of vehicle to filter requests.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of records per page.
 *     responses:
 *       200:
 *         description: Successfully retrieved spare vehicle requests.
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
 *                   example: "Requested for spare vehicle successful."
 *                 data:
 *                   type: object
 *                   properties:
 *                     spareVehicleRequests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           spareRequest:
 *                             type: object
 *                             properties:
 *                               dateRange:
 *                                 type: object
 *                                 properties:
 *                                   startDate:
 *                                     type: string
 *                                     format: date-time
 *                                     example: "2024-12-20T00:00:00.000Z"
 *                                   endDate:
 *                                     type: string
 *                                     format: date-time
 *                                     example: "2024-12-25T00:00:00.000Z"
 *                               _id:
 *                                 type: string
 *                                 example: "67694c8c6f6726e987f96dfb"
 *                               driverId:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                     example: "6738c8740eb6e4d984053db0"
 *                                   name:
 *                                     type: string
 *                                     example: "John Doe"
 *                                   phone:
 *                                     type: string
 *                                     example: "919876543210"
 *                               locationId:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                     example: "6744950c72946d53164b3a28"
 *                                   cityName:
 *                                     type: string
 *                                     example: "Bangalore"
 *                               vehicleType:
 *                                 type: string
 *                                 example: "3-wheeler (10)"
 *                               status:
 *                                 type: string
 *                                 example: "pending"
 *                               requestType:
 *                                 type: string
 *                                 example: "spare"
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-12-29T11:42:04.055Z"
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-12-29T11:42:04.055Z"
 *                             required:
 *                               - _id
 *                               - driverId
 *                               - locationId
 *                               - vehicleType
 *                               - status
 *                               - requestType
 *                               - createdAt
 *                               - updatedAt
 *                           primaryVehicle:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "67389d726320a264a3920826"
 *                               vehicleNumber:
 *                                 type: string
 *                                 example: "XYZ7890"
 *                               vehicleType:
 *                                 type: string
 *                                 example: "3-wheeler (10)"
 *                     total:
 *                       type: integer
 *                       example: 1
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       500:
 *         description: Internal server error.
 */
router.get('/get-all-spare-vehicle-requests', checkPermission('GET_ALL_SPARE_VEHICLE_REQUESTS') ,validateRequest(fetchVehicleswithuserSchema), getAllSpareVehicleRequests);

/**
 * @swagger
 * /v1/vehicle/allocate-spare-vehicle:
 *   post:
 *     summary: Allocate a spare vehicle to a vehicle request
 *     tags:
 *       - Vehicle
 *       - Web App
 *     description: This API allocates a spare vehicle to a pending vehicle request and updates the associated primary vehicle to "under-repair".
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         description: The request body should include the requestId and spareVehicleId.
 *         schema:
 *           type: object
 *           properties:
 *             requestId:
 *               type: string
 *               description: The ID of the vehicle request to which the spare vehicle is being allocated.
 *               example: "67694c8c6f6726e987f96dfb"
 *             spareVehicleId:
 *               type: string
 *               description: The ID of the spare vehicle being allocated.
 *               example: "67389d726320a264a3920826"
 *     responses:
 *       200:
 *         description: Successfully allocated the spare vehicle to the vehicle request.
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
 *                   example: "Spare Vehicle Allocated successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-12-20T00:00:00.000Z"
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-12-25T00:00:00.000Z"
 *                     _id:
 *                       type: string
 *                       example: "67694c8c6f6726e987f96dfb"
 *                     driverId:
 *                       type: string
 *                       example: "6738c8740eb6e4d984053db0"
 *                     locationId:
 *                       type: string
 *                       example: "6744950c72946d53164b3a28"
 *                     vehicleType:
 *                       type: string
 *                       example: "3-wheeler (10)"
 *                     status:
 *                       type: string
 *                       example: "processed"
 *                     requestType:
 *                       type: string
 *                       example: "spare"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-29T11:42:04.055Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-31T14:25:21.974Z"
 *                     vehicleId:
 *                       type: string
 *                       example: "67389d726320a264a3920826"
 *       500:
 *         description: Internal server error.
 */
router.post('/allocate-spare-vehicle', checkPermission('ALLOCATE_SPARE_VEHICLE'), allocateSpareVehicle);

/**
 * @swagger
 * /v1/vehicle/disable-vehicle:
 *   post:
 *     summary: Disable a vehicle from the system.
 *     description: Disables a vehicle by its ID. Only authorized users can access this endpoint.
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
 *                 required: true
 *                 example: "67389d726320a264a3920826"
 *     responses:
 *       200:
 *         description: Successfully disabled the vehicle.
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
 *                   example: "Vehicle disabled successfully."
 *       404:
 *         description: Vehicle not found.
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
 *                   example: "Vehicle not found."
 *       500:
 *         description: Internal server error.
 */
router.post('/disable-vehicle', checkPermission('DISABLE_VEHICLE'), validateRequest(disableVehicleSchema), disableVehicle);

/**
 * @swagger
 * /v1/vehicle/export-all-vehicles:
 *   get:
 *     summary: Export all vehicles.
 *     description: Retrieves a list of all vehicles based on the user's location or an optional location filter. Only vehicles available in the specified or default location are included.
 *     tags:
 *       - Vehicle
 *       - Web App
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The optional location ID to filter vehicles. If not provided, defaults to the user's location or Bangalore.
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "All Vehicles exported successfully."
 *               data:
 *                 - Vehicle Type: "Car"
 *                   Vehicle no.: "KA-01-1234"
 *                   location: "Bangalore"
 *                 - Vehicle Type: "Bike"
 *                   Vehicle no.: "MH-02-5678"
 *                   location: "Mumbai"
 *       400:
 *         description: Invalid location ID format.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid location ID format."
 *       404:
 *         description: No vehicles found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No vehicles found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/export-all-vehicles',checkPermission('GET_EXPORTED_DATA'),exportAllVehicles);

module.exports = router;