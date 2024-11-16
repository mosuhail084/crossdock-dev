const { addVehicleService } = require('../services/vehicleService');
const { successResponse, errorResponse } = require('../utils/responseUtils');

/**
 * Add a new vehicle.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.addVehicle = async (req, res) => {
    try {
        const newVehicle = await addVehicleService(req.body);

        return res.status(201).json(
            successResponse(newVehicle, 'Vehicle added successfully')
        );
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json(
            errorResponse(error.message, error.details || {})
        );
    }
};