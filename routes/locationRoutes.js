const express = require('express');
const validateRequest = require('../middleware/validateRequest');
const { addLocationSchema } = require('../validations/locationValidations');
const { addLocation } = require('../controllers/locationController');

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
router.post('/add-location', validateRequest(addLocationSchema), addLocation);

module.exports = router;