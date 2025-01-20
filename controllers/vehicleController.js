const { VEHICLE_REQUEST_TYPES } = require('../config/constants');
const vehicleRequestModel = require('../models/vehicleRequestModel');
const { addVehicleService, createRentRequest, allocateVehicleToRequest, fetchInactiveVehicles, fetchVehicleRequests, deleteVehicleService, editVehicleService, fetchAllVehicles, exportPrimaryVehicleRequestService, exportSpareVehicleRequestService, exportAllVehiclesWithUserService, getAllVehiclesWithUserService, requestSpareVehicleService, getAllSpareVehicleRequestsService, allocateSpareVehicleService, vehicleRequestStatusService } = require('../services/vehicleService');
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
    const { status, vehicleType, locationId, requestType, search, page, limit } = req.query;
    const userLocationId = req.user.locationId;

    try {
        const result = await fetchVehicleRequests({ status, vehicleType, locationId, requestType, search, page, limit }, userLocationId);
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
    const { status, search, vehicleType, locationId, vehicleNumber, requestType, page, limit } = req.query;
    const userLocationId = req.user.locationId;

    try {
        const result = await fetchAllVehicles({ status, search, vehicleType, locationId, vehicleNumber, requestType, page, limit }, userLocationId);
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

/**
 * Export primary vehicle requests based on pending status and related driver details.
 * 
 * This controller handles the HTTP request for exporting primary vehicle requests that are in a pending state. 
 * It calls the `exportPrimaryVehicleRequestService` to fetch the vehicle requests, along with related driver details 
 * (such as name and phone) and vehicle information (such as vehicle type and vehicle number).
 * 
 * @param {Object} req - The Express request object, containing the user's location ID and optional locationId query parameter.
 * @param {Object} res - The Express response object used to send the success or error response.
 * @returns {Promise<Object>} - Returns a JSON response with the primary vehicle requests data and a success message.
 * 
 * @throws {Error} - Throws an error if the vehicle request export fails or there is an issue with the request.
 */
exports.exportPrimaryVehicleRequest = async (req, res) => {
    try {
        const userLocationId = req.user.locationId;
        const { locationId } = req.query;

        const data = await exportPrimaryVehicleRequestService(userLocationId, locationId);

        return res.status(200).json(successResponse(data, 'Primary Vehicle Requests data retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Export spare vehicle requests based on pending status and related driver details, along with associated primary vehicle information.
 * 
 * This controller handles the HTTP request for exporting spare vehicle requests that are in a pending state. 
 * It calls the `exportSpareVehicleRequestService` to fetch the vehicle requests, along with related driver details 
 * (such as name and phone) and vehicle information (such as vehicle type and vehicle number). It also fetches 
 * the corresponding primary vehicle details if available.
 * 
 * @param {Object} req - The Express request object, containing the user's location ID and optional locationId query parameter.
 * @param {Object} res - The Express response object used to send the success or error response.
 * @returns {Promise<Object>} - Returns a JSON response with the spare vehicle requests data and a success message.
 * 
 * @throws {Error} - Throws an error if the vehicle request export fails or there is an issue with the request.
 */
exports.exportSpareVehicleRequest = async (req, res) => {
    try {
        const userLocationId = req.user.locationId;
        const { locationId } = req.query;

        const data = await exportSpareVehicleRequestService(userLocationId, locationId);

        return res.status(200).json(successResponse(data, 'Spare Vehicle Requests data retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Export all allocated vehicles with their related driver details.
 * 
 * This endpoint retrieves all allocated vehicle data, including the vehicle number, vehicle type, status, driver name,
 * driver contact number, allocation date, paid till date, and rental value. The result is filtered by location and can be
 * optionally filtered by a specified location ID.
 * 
 * @route GET /v1/vehicles/export-all-vehicles
 * @group Vehicles - Operations related to vehicles
 * @param {string} locationId.query - The location ID to filter vehicles (optional).
 * @returns {Object} 200 - Success response with vehicle data
 * @returns {Object} 500 - Error response if an internal server error occurs
 * 
 * @throws {Error} - Throws an error if the operation fails or the location is not found.
 */
exports.exportAllVehiclesWithUser = async (req, res) => {
    try {
        const userLocationId = req.user.locationId;
        const { locationId } = req.query;

        const data = await exportAllVehiclesWithUserService(userLocationId, locationId);

        return res.status(200).json(successResponse(data, 'All Vehicle data exported successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Retrieve all allocated vehicles with associated driver data and pagination support.
 * 
 * This controller fetches all vehicle requests for allocated vehicles. It includes details such as vehicle number, vehicle type, 
 * status, rental value, and driver details (name and contact number). The controller also supports pagination and allows filtering 
 * by the vehicle status. The result is filtered by location and can be optionally filtered by a specified location ID and status.
 * 
 * @param {Object} req - The request object, containing query parameters for filtering and pagination.
 * @param {Object} res - The response object used to return the result or error.
 * 
 * @returns {Object} - A JSON response containing the list of allocated vehicles with associated driver details and pagination information.
 * 
 * @throws {Error} - Throws an error if the operation fails or if invalid data is provided.
 */
exports.getAllVehiclesWithUser = async (req, res) => {
    try {
        const userLocationId = req.user.locationId;
        const { locationId, vehicleType, search, status, page, limit } = req.query;

        const data = await getAllVehiclesWithUserService(userLocationId, locationId, search, vehicleType, status, page, limit);

        return res.status(200).json(successResponse(data, 'All Vehicle data retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Handles the request for a spare vehicle.
 * 
 * This controller processes a user's request for a spare vehicle. It utilizes the user's ID and location 
 * to identify the spare vehicle request and ensures the operation is logged and handled appropriately.
 * 
 * @param {Object} req - The request object containing user details.
 * @param {Object} res - The response object used to return the result or an error.
 * 
 * @returns {Object} - A JSON response indicating the success or failure of the operation.
 */
exports.requestSpareVehicle = async (req, res) => {
    try {
        const { userId, locationId } = req.user;
        const data = await requestSpareVehicleService({ userId, locationId });
        return res.status(200).json(successResponse(data, 'Requested for spare vehicle successful.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Retrieves the status of the user's vehicle request.
 * 
 * This endpoint returns the status of the user's vehicle request, which can be either primary or spare.
 * The user's ID is used to identify the request and the status is returned in the response.
 * 
 * @param {Object} req - The Express request object containing the user's ID.
 * @param {Object} res - The Express response object used to send the result or an error.
 * 
 * @returns {Object} - A JSON response containing the status of the vehicle request.
 * 
 * @throws {Error} - Returns a 500 status code if the service fails to fetch the status.
 */
exports.vehicleRequestStatus = async (req, res) => {
    try {
        const { userId } = req.user;

        const status = await vehicleRequestStatusService(userId);
        return res.status(200).json(successResponse(status, 'Vehicle request status fetched successful.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
}

/**
 * Controller to fetch all spare vehicle requests.
 * 
 * This function retrieves a paginated list of all pending spare vehicle requests with optional filters 
 * for location and vehicle type. The user’s location is used if no location filter is provided.
 * 
 * @param {Object} req - The Express request object containing query parameters and authenticated user details.
 * @param {Object} res - The Express response object to send the result or an error.
 * 
 * @returns {Object} - JSON response containing a list of spare vehicle requests or an error message.
 * 
 * @throws {Error} - Returns a 500 status code if the service fails to fetch the requests.
 */
exports.getAllSpareVehicleRequests = async (req, res) => {
    try {
        const userLocationId = req.user.locationId;
        const { locationId, vehicleType, search, page, limit } = req.query;
        const data = await getAllSpareVehicleRequestsService(userLocationId, locationId, search, vehicleType, page, limit);
        return res.status(200).json(successResponse(data, 'Requested for spare vehicle successful.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Controller to fetch all spare vehicle requests.
 * 
 * This function retrieves a paginated list of all pending spare vehicle requests with optional filters 
 * for location and vehicle type. The user’s location is used if no location filter is provided.
 * 
 * @param {Object} req - The Express request object containing query parameters and authenticated user details.
 * @param {Object} res - The Express response object to send the result or an error.
 * 
 * @returns {Object} - JSON response containing a list of spare vehicle requests or an error message.
 * 
 * @throws {Error} - Returns a 500 status code if the service fails to fetch the requests.
 */
exports.allocateSpareVehicle = async (req, res) => {
    try {
        const { requestId, spareVehicleId } = req.body;
        const data = await allocateSpareVehicleService(requestId, spareVehicleId);
        return res.status(200).json(successResponse(data, 'Spare Vehicle Allocated successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

exports.disableVehicle = async (req, res) => {
    const { rentRequestId } = req.body;
    const now = new Date();

    try {
        const vehicleRequest = await vehicleRequestModel.findOne({ _id: rentRequestId });

        if (!vehicleRequest) {
            return res.status(404).json(errorResponse('Vehicle not found!'));
        }

        vehicleRequest.disabledAt = now.toISOString();
        await vehicleRequest.save();

        return res.status(200).json(successResponse(vehicleRequest, 'Vehicle disabled successfully.'));
    } catch (error) {
        console.log('Error performing mutation:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};