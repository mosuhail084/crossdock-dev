const { VEHICLE_RENTAL_VALUES, VEHICLE_REQUEST_TYPES, VEHICLE_REQUEST_STATUSES, VEHICLE_STATUSES } = require('../config/constants');
const Vehicle = require('../models/vehicleModel');
const VehicleRequest = require('../models/vehicleRequestModel');
const Location = require('../models/locationModel');


/**
 * Adds a new vehicle to the collection.
 * @param {Object} vehicleData - The data for the new vehicle.
 * @param {string} vehicleData.vehicleNumber - The vehicle number.
 * @param {string} vehicleData.vehicleType - The type of vehicle.
 * @param {Number} [vehicleData.rentalValue] - The rental value of the vehicle.
 * @throws {Error} - If the vehicle with the same number already exists.
 * @returns {Promise<Object>} - The newly created vehicle object.
 */
exports.addVehicleService = async (vehicleData) => {
    const { vehicleNumber, vehicleType, rentalValue } = vehicleData;

    try {
        const existingVehicle = await Vehicle.findOne({ vehicleNumber });
        if (existingVehicle) {
            const error = new Error('Vehicle with this number already exists');
            error.statusCode = 400;
            error.details = { vehicleNumber };
            throw error;
        }

        if (!rentalValue) {
            vehicleData.rentalValue = VEHICLE_RENTAL_VALUES[vehicleType];
        }

        const newVehicle = new Vehicle(vehicleData);
        return await newVehicle.save();
    } catch (error) {
        throw error;
    }
};


/**
 * Create a new rent request.
 * @param {Object} rentRequestData - The data for the rent request.
 * @param {string} rentRequestData.driverId - The ID of the driver making the request.
 * @param {string} rentRequestData.locationId - The ID of the location where the request is being made.
 * @param {string} rentRequestData.vehicleType - The type of vehicle requested.
 * @param {Object} rentRequestData.dateRange - The date range for the rent request.
 * @param {Date} rentRequestData.dateRange.startDate - The start date of the rent period.
 * @param {Date} rentRequestData.dateRange.endDate - The end date of the rent period.
 * @returns {Promise<Object>} - The newly created rent request object.
 */
exports.createRentRequest = async (rentRequestData) => {
    const { driverId, vehicleType, dateRange, locationId } = rentRequestData;

    const newRequest = new VehicleRequest({
        driverId,
        locationId,
        vehicleType,
        dateRange,
        requestType: VEHICLE_REQUEST_TYPES.PRIMARY,
    });

    return await newRequest.save();
};

/**
 * Allocates a vehicle to a pending rent request.
 * @param {String} rentRequestId - ID of the rent request.
 * @param {String} vehicleId - ID of the vehicle to allocate.
 * @returns {Object} - Updated rent request.
 * @throws {Error} - If the rent request is not found or not in a pending state.
 */
exports.allocateVehicleToRequest = async (rentRequestId, vehicleId) => {
    const rentRequest = await VehicleRequest.findById(rentRequestId);

    if (!rentRequest) {
        throw new Error('Rent request not found.');
    }

    if (rentRequest.status !== VEHICLE_REQUEST_STATUSES.PENDING) {
        throw new Error('Rent request is not in a pending state.');
    }

    rentRequest.vehicleId = vehicleId;
    rentRequest.status = VEHICLE_REQUEST_STATUSES.APPROVED;

    return await rentRequest.save();
};

/**
 * Fetches all inactive vehicles based on vehicle type with pagination.
 * @param {Object} queryParams - Query parameters for pagination and filters.
 * @returns {Object} - Paginated list of inactive vehicles.
 * @throws {Error} - If any error occurs while fetching vehicles.
 */
exports.fetchInactiveVehicles = async (queryParams) => {
    const { vehicleType, vehicleNumber, locationId, page = 1, limit = 10 } = queryParams;

    const query = { status: VEHICLE_STATUSES.INACTIVE };

    if (vehicleType) {
        query.vehicleType = vehicleType;
    }

    if (vehicleNumber) {
        query.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };
    }

    if (locationId) {
        query.locationId = locationId;
    }

    try {
        const total = await Vehicle.countDocuments(query);
        const vehicles = await Vehicle.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit, 10))
            .sort({ createdAt: -1 });

        return { vehicles, total, page, limit };
    } catch (error) {
        throw new Error('Failed to fetch inactive vehicles.');
    }
};


/**
 * Fetches vehicle requests with pagination and filters.
 * @param {Object} queryParams - Query parameters for filters and pagination.
 * @param {string} [queryParams.status] - The status of the vehicle request.
 * @param {string} [queryParams.vehicleType] - The type of vehicle requested.
 * @param {string} [queryParams.locationId] - The ID of the location where the request is being made.
 * @param {string} [queryParams.requestType] - The type of vehicle request.
 * @param {number} [queryParams.page] - The page number for pagination. Default is 1.
 * @param {number} [queryParams.limit] - The number of vehicle requests per page. Default is 10.
 * @param {string} userLocationId - The ID of the user's location.
 * @returns {Promise<Object>} - Object with paginated vehicle requests data.
 * @throws {Error} - If any error occurs while fetching vehicle requests.
 */
exports.fetchVehicleRequests = async (queryParams, userLocationId) => {
    const { status, vehicleType, locationId, requestType, page = 1, limit = 10 } = queryParams;

    if (!locationId && !userLocationId) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        userLocationId = bangaloreLocation._id;
    }

    const query = { locationId: locationId || userLocationId, status: status || VEHICLE_REQUEST_STATUSES.PENDING };

    if (vehicleType) {
        query.vehicleType = vehicleType;
    }

    if (requestType) {
        query.requestType = requestType;
    }

    try {
        const total = await VehicleRequest.countDocuments(query);
        const vehicleRequests = await VehicleRequest.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit, 10))
            .populate('driverId', 'name email phone')
            .populate('vehicleId', 'vehicleNumber vehicleType')
            .populate('locationId', 'locationName');

        return { vehicleRequests, total, page, limit };
    } catch (error) {
        throw new Error('Failed to fetch vehicle requests.');
    }
};

/**
 * Deletes a vehicle from the collection.
 * @param {string} vehicleId - The ID of the vehicle to delete.
 * @returns {Promise<Object>} - The deleted vehicle object.
 * @throws {Error} - If the vehicle is not found.
 */
exports.deleteVehicleService = async (vehicleId) => {
    try {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            const error = new Error('Vehicle not found');
            error.statusCode = 404;
            throw error;
        }
        await Vehicle.findByIdAndDelete(vehicleId);
        return { message: 'Vehicle deleted successfully', vehicle };
    } catch (error) {
        throw new Error('Error deleting vehicle: ' + error.message);
    }
};

/**
 * Edit a vehicle from the collection.
 * @param {string} vehicleId - The ID of the vehicle to edit.
 * @returns {Promise<Object>} - The edited vehicle object.
 * @throws {Error} - If the vehicle is not found.
 */
exports.editVehicleService = async (vehicleId, vehicleData) => {
    const { vehicleNumber, vehicleType, locationId, status } = vehicleData;
    try {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            const error = new Error('Vehicle not found.');
            error.statusCode = 404;
            throw error;
        }
        const fieldsToUpdate = { vehicleType, locationId, status };

        if (vehicleType && vehicleType !== vehicle.vehicleType) {
            fieldsToUpdate.rentalValue = VEHICLE_RENTAL_VALUES[vehicleType];
        }

        if (vehicleNumber && vehicleNumber.trim() !== vehicle.vehicleNumber) {
            const existingVehicleWithNumber = await Vehicle.findOne({ vehicleNumber: vehicleNumber, _id: { $ne: vehicleId } });

            if (existingVehicleWithNumber) {
                throw new Error(`Vehicle number ${vehicleData.vehicleNumber} already exists.`);
            }
            fieldsToUpdate.vehicleNumber = vehicleNumber;
        }

        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            vehicleId,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        );
        return updatedVehicle;

    } catch (error) {
        throw new Error('Error updating vehicle: ' + error.message);
    }
};

/**
 * Fetches all vehicles based on filters and pagination.
 * @param {Object} queryParams - Query parameters for filters and pagination.
 * @param {string} [queryParams.vehicleType] - The type of vehicle to filter by.
 * @param {string} [queryParams.vehicleNumber] - The vehicle number to search for (partial or full match).
 * @param {string} [queryParams.locationId] - The location ID to filter by.
 * @param {string} [queryParams.status] - The status of the vehicles to filter by (e.g., Active, Inactive).
 * @param {number} [queryParams.page] - The page number for pagination. Default is 1.
 * @param {number} [queryParams.limit] - The number of vehicles per page. Default is 10.
 * @returns {Promise<Object>} - Paginated and filtered list of vehicles.
 * @throws {Error} - If an error occurs during the operation.
 */
exports.fetchAllVehicles = async (queryParams, userLocationId) => {
    const { vehicleType, vehicleNumber, locationId, status, page = 1, limit = 10 } = queryParams;

    const query = {};
    if (!locationId && !userLocationId) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        query.locationId = bangaloreLocation._id;
    }

    if (vehicleType) {
        query.vehicleType = vehicleType;
    }

    if (vehicleNumber) {
        query.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };
    }

    if (locationId || userLocationId) {
        query.locationId = locationId || userLocationId;
    }

    if (status) {
        query.status = status;
    }

    try {
        const total = await Vehicle.countDocuments(query);
        const vehicles = await Vehicle.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit, 10))
            .populate('locationId', 'cityName');

        return { vehicles, total, page, limit };
    } catch (error) {
        throw new Error('Failed to fetch vehicles: ' + error.message);
    }
};
