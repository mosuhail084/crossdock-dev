const express = require('express');
const validateRequest = require('../middleware/validateRequest');
const { addLocationSchema } = require('../validations/locationValidations');
const { addLocation, getLocations } = require('../controllers/locationController');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

/**
 * @swagger
 * /v1/location/add-location:
 *   post:
 *     summary: Add a new location to the system.
 *     description: Adds a new location with a unique city name. Only authorized users can access this endpoint.
 *     tags:
 *       - Location
 *       - Web App
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cityName:
 *                 type: string
 *                 description: The name of the city for the location.
 *             example:
 *               cityName: "New Delhi"
 *     responses:
 *       '201':
 *         description: Location added successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Location added successfully"
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 cityName: "New Delhi"
 *       '400':
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Validation error: Location already exists"
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post('/add-location', checkPermission('ADD_LOCATION'), validateRequest(addLocationSchema), addLocation);

/**
 * @swagger
 * /v1/location/get-locations:
 *   get:
 *     summary: Retrieve all locations.
 *     description: Fetch all locations stored in the system.
 *     tags:
 *       - Location
 *     responses:
 *       '200':
 *         description: A list of locations.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Locations retrieved successfully."
 *               data:
 *                 - _id: "64fa3a17dabc1f00012345ef"
 *                   name: "Location A"
 *                   coordinates: { lat: 28.7041, lng: 77.1025 }
 *                 - _id: "64fa3a17dabc1f00012345gh"
 *                   name: "Location B"
 *                   coordinates: { lat: 19.0760, lng: 72.8777 }
 *       '404':
 *         description: No locations found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No locations found."
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/get-locations', checkPermission('GET_ALL_LOCATIONS'), getLocations);

module.exports = router;