// controllers/locationController.js
const { addLocationService } = require('../services/locationService');
const { successResponse, errorResponse } = require('../utils/responseUtils');

/**
 * Add a new location.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.addLocation = async (req, res) => {
    const { cityName } = req.body;

    try {
        const newLocation = await addLocationService(cityName);
        return res.status(201).json(successResponse(newLocation, 'Location added successfully'));
    } catch (error) {
        console.error('Error adding location:', error);
        return res.status(error.statusCode || 500).json(
            errorResponse(error.message || 'Internal server error', { error: error.details || null })
        );
    }
};