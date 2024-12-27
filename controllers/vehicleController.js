const { addVehicleService, createRentRequest, allocateVehicleToRequest, fetchInactiveVehicles, fetchVehicleRequests, deleteVehicleService, editVehicleService, fetchAllVehicles } = require('../services/vehicleService');
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

/**
 * Controller to create a new rent request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.createRentRequestController = async (req, res) => {
    try {
        const { vehicleType, dateRange } = req.body;

        const rentRequestData = {
            driverId: req.user.userId,
            locationId: req.user.locationId,
            vehicleType,
            dateRange,
        };

        const rentRequest = await createRentRequest(rentRequestData);
        return res
            .status(201)
            .json(successResponse(rentRequest, 'Rent request created successfully.'));
    } catch (error) {
        return res
            .status(error.status || 500)
            .json(errorResponse(error.message || 'Failed to create rent request.'));
    }
};

/**
 * Allocates a vehicle to a pending rent request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - Response with updated rent request or error.
 */
exports.allocateVehicle = async (req, res) => {
    const { rentRequestId, vehicleId } = req.body;

    try {
        const updatedRequest = await allocateVehicleToRequest(rentRequestId, vehicleId);
        return res.status(200).json(successResponse(updatedRequest, 'Vehicle allocated successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message));
    }
};

/**
 * Fetches inactive vehicles based on vehicle type with pagination.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - List of inactive vehicles or error response.
 */
exports.getInactiveVehicles = async (req, res) => {
    const { vehicleType, vehicleNumber, locationId, page, limit } = req.query;

    try {
        const result = await fetchInactiveVehicles({ vehicleType, vehicleNumber, locationId, page, limit });
        return res.status(200).json(successResponse(result, 'Inactive vehicles retrieved successfully.'));
    } catch (error) {
        return res.status(500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Fetches all vehicle requests with pagination and filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - Paginated vehicle requests or error response.
 */
exports.getAllVehicleRequests = async (req, res) => {
    const { status, vehicleType, locationId, requestType, page, limit } = req.query;
    const userLocationId = req.user.locationId;

    try {
        const result = await fetchVehicleRequests({ status, vehicleType, locationId, requestType, page, limit }, userLocationId);
        return res.status(200).json(successResponse(result, 'Vehicle requests retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Fetches all vehicles with pagination and filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - Paginated vehicle requests or error response.
 */
exports.getAllVehicles = async (req, res) => {
    const { status, vehicleType, locationId, requestType, page, limit } = req.query;
    const userLocationId = req.user.locationId;

    try {
        const result = await fetchAllVehicles({ status, vehicleType, locationId, requestType, page, limit }, userLocationId);
        return res.status(200).json(successResponse(result, 'Vehicle retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Deletes a vehicle based on the provided vehicle ID.
 * @param {Object} req - Express request object, containing the vehicle ID in params.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - Confirmation of vehicle deletion or error response.
 */
exports.deleteVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const deletedVehicle = await deleteVehicleService(vehicleId);

        return res.status(200).json(successResponse(deletedVehicle, 'Vehicle deleted successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Updates the details of an existing vehicle.
 * @param {Object} req - Express request object, containing the vehicle ID in params and vehicle data in body.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - Updated vehicle details or error response.
 */
exports.editVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const vehicleData = req.body;

        const updatedVehicle = await editVehicleService(vehicleId, vehicleData);

        return res.status(200).json(successResponse(updatedVehicle, 'Vehicle updated successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};
