const { VEHICLE_RENTAL_VALUES, VEHICLE_REQUEST_TYPES, VEHICLE_REQUEST_STATUSES, VEHICLE_STATUSES, ROLES } = require('../config/constants');
const Vehicle = require('../models/vehicleModel');
const VehicleRequest = require('../models/vehicleRequestModel');
const Location = require('../models/locationModel');
const User = require('../models/userModel');

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
    const { status, vehicleType, locationId, requestType, search, page = 1, limit = 10 } = queryParams;

    let location;

    // Convert locationId (if string) to ObjectId, or fallback to userLocationId
    if (locationId) {
        location = new mongoose.Types.ObjectId(locationId);
    } else if (userLocationId) {
        location = userLocationId;
    } else {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        location = bangaloreLocation._id;
    }

    const matchStage = {
        $match: {
            locationId: location,
            status: status || VEHICLE_REQUEST_STATUSES.PENDING,
        },
    };

    if (vehicleType) {
        matchStage.$match.vehicleType = vehicleType;
    }

    if (requestType) {
        matchStage.$match.requestType = requestType;
    }

    try {
        const pipeline = [
            // Initial match
            matchStage,
            // Lookup driver details
            {
                $lookup: {
                    from: 'users',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'driver',
                },
            },
            {
                $unwind: {
                    path: '$driver',
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Lookup vehicle details
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'vehicleId',
                    foreignField: '_id',
                    as: 'vehicle',
                },
            },
            {
                $unwind: {
                    path: '$vehicle',
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Lookup location details
            {
                $lookup: {
                    from: 'locations',
                    localField: 'locationId',
                    foreignField: '_id',
                    as: 'location',
                },
            },
            {
                $unwind: {
                    path: '$location',
                    preserveNullAndEmptyArrays: true,
                },
            },
            // Apply search filter after lookups
            ...(search
                ? [
                    {
                        $match: {
                            $or: [
                                { 'driver.phone': { $regex: search, $options: 'i' } },
                                { 'driver.name': { $regex: search, $options: 'i' } },
                            ],
                        },
                    },
                ]
                : []),
            // Sort by creation date in descending order
            { $sort: { createdAt: -1 } },
            // Pagination
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: parseInt(limit, 10) },
                    ],
                },
            },
            // Simplify the results
            {
                $unwind: {
                    path: '$total',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    total: '$total.count',
                    vehicleRequests: '$data',
                },
            },
        ];

        const result = await VehicleRequest.aggregate(pipeline);

        // If no data is returned, provide a default response
        return {
            vehicleRequests: result[0]?.vehicleRequests || [],
            total: result[0]?.total || 0,
            page,
            limit,
        };
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
 * Updates the status of a vehicle request.
 * @param {string} _id - The ID of the vehicle request to update.
 * @param {string} paymentId - The ID of the payment (if applicable) to store with the updated request.
 * @param {string} newStatus - The new status of the vehicle request.
 * @returns {Promise<Object>} - The updated vehicle request object.
 * @throws {Error} - If the vehicle request is not found.
 */
exports.updateVehicleRequestStatus = async (_id, newStatus, paymentId = null) => {
    const result = await VehicleRequest.findOneAndUpdate(
        { _id },
        { status: newStatus, paymentId },
        { new: true }
    );

    if (!result) {
        throw new Error(`Vehicle request not found for orderId: ${orderId}`);
    }

    return result;
};

/**
 * Updates the status of a vehicle.
 * @param {string} vehicleId - The ID of the vehicle to update.
 * @param {string} newStatus - The new status of the vehicle.
 * @returns {Promise<Object>} - The updated vehicle object.
 * @throws {Error} - If the vehicle is not found.
 */
exports.updateVehicleStatus = async (vehicleId, newStatus) => {
    const result = await Vehicle.findOneAndUpdate(
        { _id: vehicleId },
        { status: newStatus },
        { new: true }
    );

    if (!result) {
        throw new Error(`Vehicle not found for vehicleId: ${vehicleId}`);
    }

    return result;
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
    const { vehicleType, vehicleNumber, locationId, status, search, page = 1, limit = 10 } = queryParams;

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
    if (search) {
        query.vehicleNumber = { $regex: search, $options: 'i' };
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

/**
 * Export primary vehicle requests with pending status and related driver details.
 * 
 * This service fetches all vehicle requests with a pending status and includes details of the driver and vehicle, 
 * if available. Results are filtered by location and sorted by the most recent updates.
 * 
 * @param {string} userLocationId - The location ID associated with the user making the request.
 * @param {string} locationId - The location ID specified in the query parameters (optional).
 * @returns {Promise<Object>} - An object containing the list of primary vehicle requests and a success message.
 * 
 * @throws {Error} - Throws an error if the operation fails or the location is not found.
 */
exports.exportPrimaryVehicleRequestService = async (userLocationId, locationId) => {
    const query = {
        status: VEHICLE_REQUEST_STATUSES.PENDING,
        requestType: VEHICLE_REQUEST_TYPES.PRIMARY
    };
    if (!locationId && !userLocationId) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        query.locationId = bangaloreLocation._id;
    }
    else {
        query.locationId = locationId || userLocationId;
    }
    try {
        const vehicleRequests = await VehicleRequest.find(query)
            .populate('driverId', 'name phone')
            .populate('vehicleId', 'vehicleNumber vehicleType createdAt')
            .sort({ updatedAt: -1 });

        const primaryVehicleRequests = vehicleRequests.map((request) => ({
            "Name of driver": request.driverId.name || null,
            "Contact no.": request.driverId.phone || null,
            "Date of request": request.createdAt,
            "Vehicle type": request.vehicleId?.vehicleType || null,
            "Vehicle number": request.vehicleId?.vehicleNumber || null,
        }));
        return {
            primaryVehicleRequests,
            message: 'primary Vehicle Requests exported successfully.',
        };
    } catch (error) {
        throw new Error('Failed to fetch primary Vehicle Requests: ' + error.message);
    }
};

/**
 * Export spare vehicle requests with pending status and related driver details, along with associated primary vehicle information.
 * 
 * This service fetches all vehicle requests with a pending status and request type 'SPARE'. It then associates each spare vehicle 
 * request with the corresponding primary vehicle request, based on the driver ID and the condition that the primary vehicle's 
 * `updatedAt` timestamp is earlier than that of the spare vehicle. The result is filtered by location and sorted by the most 
 * recent spare vehicle requests.
 * 
 * @param {string} userLocationId - The location ID associated with the user making the request.
 * @param {string} locationId - The location ID specified in the query parameters (optional).
 * @returns {Promise<Object>} - An object containing the list of spare vehicle requests with their primary vehicle numbers 
 * and a success message.
 * 
 * @throws {Error} - Throws an error if the operation fails or the location is not found.
 */
exports.exportSpareVehicleRequestService = async (userLocationId, locationId) => {
    const query = {
        status: VEHICLE_REQUEST_STATUSES.PENDING,
        requestType: VEHICLE_REQUEST_TYPES.SPARE
    };
    if (!locationId && !userLocationId) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        query.locationId = bangaloreLocation._id;
    }
    else {
        query.locationId = locationId || userLocationId;
    }
    try {
        const spareVehicleRequests = await VehicleRequest.find(query)
            .sort({ createdAt: -1 })
            .populate('driverId', 'name phone')
            .populate('vehicleId', 'vehicleNumber vehicleType');

        const result = [];
        for (const spareRequest of spareVehicleRequests) {
            const primaryVehicleRequests = await VehicleRequest.find({
                requestType: VEHICLE_REQUEST_TYPES.PRIMARY,
                driverId: spareRequest.driverId._id,
                status: VEHICLE_REQUEST_STATUSES.PROCESSED,
                updatedAt: { $lt: spareRequest.updatedAt }
            })
                .sort({ updatedAt: -1 })
                .populate('vehicleId', 'vehicleNumber');

            if (primaryVehicleRequests.length > 0) {
                const primaryVehicle = primaryVehicleRequests[0];
                result.push({
                    "Name of driver": spareRequest.driverId.name || null,
                    "Contact no.": spareRequest.driverId.phone || null,
                    "Date of request": spareRequest.createdAt || null,
                    "Vehicle type": spareRequest.vehicleId?.vehicleType || null,
                    "Primary vehicle": primaryVehicle.vehicleId?.vehicleNumber || null,
                    "Spare vehicle": spareRequest.vehicleId?.vehicleNumber || null,
                });
            }
        }
        return {
            spareVehicleRequests: result,
        };
    } catch (error) {
        throw new Error('Failed to fetch spare Vehicle Requests: ' + error.message);
    }
};

/**
 * Export all allocated vehicles with driver details and associated information.
 * 
 * This service retrieves all vehicle requests for allocated vehicles. It includes details such as vehicle number, vehicle type, 
 * status, rental value, and driver details (name and contact number). Additionally, it fetches the allocation date and the paid till 
 * date for each vehicle within the specified location.
 * 
 * @param {string} userLocationId - The location ID associated with the user making the request.
 * @param {string} locationId - The location ID specified in the query parameters (optional). If not provided, defaults to the user's location.
 * 
 * @returns {Promise<Object>} - An object containing the list of all allocated vehicles with the associated driver details and rental information.
 * 
 * @throws {Error} - Throws an error if the operation fails or the location is not found.
 */
exports.exportAllVehiclesWithUserService = async (userLocationId, locationId) => {
    try {
        const query = {};
        if (!locationId && !userLocationId) {
            const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
            if (!bangaloreLocation) {
                throw new Error('Bangalore location not found.');
            }
            query.locationId = bangaloreLocation._id;
        } else {
            query.locationId = locationId || userLocationId;
        }
        const vehicles = await Vehicle.find(query, 'vehicleNumber vehicleType status rentalValue');
        const vehicleData = [];
        for (const vehicle of vehicles) {
            const vehicleRequests = await VehicleRequest.find({ vehicleId: vehicle._id, status: VEHICLE_REQUEST_STATUSES.PROCESSED })
                .sort({ updatedAt: -1 })
                .populate('driverId', 'name phone')
                .populate('locationId', 'cityName');

            let driverName = null;
            let driverPhone = null;
            let startDate = null;
            let endDate = null;
            let rentalValue = vehicle.rentalValue || null;

            if (vehicleRequests.length > 0) {
                const latestVehicleRequest = vehicleRequests[0];

                driverName = latestVehicleRequest.driverId.name || null;
                driverPhone = latestVehicleRequest.driverId.phone || null;
                startDate = latestVehicleRequest.dateRange?.startDate || null;
                endDate = latestVehicleRequest.dateRange?.endDate || null;
            }
            vehicleData.push({
                "Vehicle Number": vehicle.vehicleNumber || null,
                "Vehicle Type": vehicle.vehicleType || null,
                "Status": vehicle.status || null,
                "Driver Name": driverName || null,
                "Driver Contact No.": driverPhone,
                "Allocation Date": startDate || null,
                "Paid Till Date": endDate || null,
                "Rental Value": rentalValue || null,
            });
        }
        return vehicleData;
    } catch (error) {
        throw new Error(`Error fetching data: ${error.message}`);
    }
};

/**
 * Retrieves a paginated list of all allocated vehicles with associated driver details and rental information.
 * 
 * This service fetches all vehicle requests for allocated vehicles. It includes details such as vehicle number, vehicle type, 
 * status, rental value, and driver details (name and contact number). Additionally, it fetches the allocation date and the paid till 
 * date for each vehicle within the specified location.
 * 
 * @param {string} userLocationId - The location ID associated with the user making the request.
 * @param {string} [locationId] - The location ID specified in the query parameters (optional). If not provided, defaults to the user's location.
 * @param {string} [vehicleType] - The type of vehicle to filter by (e.g., "2-wheeler", "4-wheeler").
 * @param {string} [status] - The status of the vehicle to filter by (e.g., "active", "inactive").
 * @param {number} [page=1] - The page number for pagination.
 * @param {number} [limit=10] - The number of items per page for pagination.
 * 
 * @returns {Promise<Object>} - An object containing the list of all allocated vehicles with the associated driver details and rental information.
 *                              - Pagination metadata (`total`, `page`, `limit`, `totalPages`).
 *                              - Success message.
 * 
 * @throws {Error} - Throws an error if the operation fails or the location is not found.
 */
exports.getAllVehiclesWithUserService = async (userLocationId, locationId, search, vehicleType, status, page = 1, limit = 10) => {
    try {
        let effectiveLocationId = locationId || userLocationId;

        if (!effectiveLocationId) {
            const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
            if (!bangaloreLocation) {
                throw new Error('Bangalore location not found.');
            }
            effectiveLocationId = bangaloreLocation._id;
        } else {
            effectiveLocationId = new mongoose.Types.ObjectId(effectiveLocationId);
        }

        const matchCriteria = {
            status: VEHICLE_REQUEST_STATUSES.PROCESSED,
            requestType: VEHICLE_REQUEST_TYPES.PRIMARY,
            locationId: effectiveLocationId,
        };

        if (vehicleType !== undefined) {
            matchCriteria.vehicleType = vehicleType;
        }
        const searchMatch = search ? {
            $or: [
                { 'vehicle.vehicleNumber': { $regex: search, $options: 'i' } },
                { 'driver.name': { $regex: search, $options: 'i' } },
                { 'driver.phone': { $regex: search, $options: 'i' } },
            ]
        } : {};

        const pipeline = [
            { $match: matchCriteria },
            {
                $lookup: {
                    from: 'users',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'driver',
                },
            },
            { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'vehicleId',
                    foreignField: '_id',
                    as: 'vehicle',
                },
            },
            { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
            { $match: { ...searchMatch, ...(status ? { 'vehicle.status': status } : {}) } },
            {
                $project: {
                    _id: 0,
                    VehicleNumber: { $ifNull: ['$vehicle.vehicleNumber', null] },
                    vehicleType: { $ifNull: ['$vehicle.vehicleType', null] },
                    status: status || { $ifNull: ['$vehicle.status', null] },
                    driverName: { $ifNull: ['$driver.name', null] },
                    driverContactNo: { $ifNull: ['$driver.phone', null] },
                    allocationDate: { $ifNull: ['$dateRange.startDate', null] },
                    paidTillDate: { $ifNull: ['$dateRange.endDate', null] },
                    RentRequestId: { $ifNull: ['$_id', null] },
                    disabledAt: { $ifNull: ['$disabledAt', null] },
                    rentalValue: { $ifNull: ['$vehicle.rentalValue', null] },
                },
            },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: parseInt(limit, 10) },
                    ],
                },
            },
        ];
        const result = await VehicleRequest.aggregate(pipeline);

        const total = result[0]?.metadata[0]?.total || 0;
        const vehicleData = result[0]?.data || [];

        const totalPages = Math.ceil(total / limit);

        return {
            result: vehicleData,
            total,
            page,
            limit,
            totalPages,
        };
    } catch (error) {
        throw new Error(`Error fetching data: ${error.message}`);
    }
};


/**
 * Service to handle the creation of a spare vehicle request.
 * 
 * This service checks if the driver has an active vehicle request within the current date range. 
 * If an active request exists, it creates a new spare vehicle request with the same date range and vehicle type.
 * 
 * @param {Object} driverData - The data of the driver making the request.
 * @param {string} driverData.driverId - The unique ID of the driver.
 * @param {string} driverData.locationId - The location ID of the driver.
 * 
 * @returns {Object} - The newly created spare vehicle request document.
 * 
 * @throws {Error} - Throws an error if no active vehicle request is found.
 */
const mongoose = require('mongoose');
exports.requestSpareVehicleService = async (driverData) => {
    const { userId, locationId } = driverData;
    const currentDate = new Date();
    const activeRequest = await VehicleRequest.findOne({
        driverId: userId,
        'dateRange.startDate': { $lte: currentDate },
        'dateRange.endDate': { $gte: currentDate },
        status: VEHICLE_REQUEST_STATUSES.PROCESSED,
        requestType: VEHICLE_REQUEST_TYPES.PRIMARY
    });
    if (!activeRequest) {
        throw new Error('No active vehicle request found. Cannot create a spare request.');
    }
    const { vehicleType, paymentId, dateRange: activeDateRange } = activeRequest;
    const dateRange = { startDate: currentDate, endDate: activeDateRange.endDate };

    const newSpareRequest = new VehicleRequest({
        driverId: userId,
        locationId,
        vehicleType,
        dateRange,
        paymentId,
        status: VEHICLE_REQUEST_STATUSES.PENDING,
        requestType: VEHICLE_REQUEST_TYPES.SPARE,
    });
    await newSpareRequest.save();
    return newSpareRequest;
};

/**
 * Retrieves the status of the most recent primary and spare vehicle requests for a specific driver.
 * 
 * @param {string} userId - The ID of the user (driver) whose vehicle request statuses are being retrieved.
 * 
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array containing the statuses of the most recent 
 *                                     primary and spare vehicle requests:
 *                                     - Each object contains:
 *                                       - `status`: The status of the vehicle request.
 *                                       - `reqType`: The type of the vehicle request (either "PRIMARY" or "SPARE").
 */
/**
 * Fetches the latest vehicle requests status for a driver
 * @param {string} userId - The driver's user ID
 * @returns {Promise<Array>} Array of vehicle request statuses
 * @throws {Error} If database query fails
 */
exports.vehicleRequestStatusService = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Fetch both primary and spare requests in a single query
        const vehicleRequests = await VehicleRequest.find({
            driverId: userId,
            requestType: { $in: [VEHICLE_REQUEST_TYPES.PRIMARY, VEHICLE_REQUEST_TYPES.SPARE] }
        })
            .sort({ requestType: 1, updatedAt: -1 })
            .lean(); // Use lean() for better performance since we don't need the full document

        // Group by requestType and get the latest request for each type
        const requestMap = vehicleRequests.reduce((acc, request) => {
            if (!acc[request.requestType] || 
                new Date(request.updatedAt) > new Date(acc[request.requestType].updatedAt)) {
                acc[request.requestType] = request;
            }
            return acc;
        }, {});

        // Format the response
        const result = Object.values(requestMap).map(request => ({
            status: request.status,
            reqType: request.requestType,
            vehicleId: request.vehicleId,
            vehicleRequestId: request._id
        }));

        return result;

    } catch (error) {
        console.error('Error in vehicleRequestStatusService:', error);
        throw new Error(`Failed to fetch vehicle request status: ${error.message}`);
    }
};

/**
 * Service to fetch all spare vehicle requests.
 * 
 * This service retrieves all pending spare vehicle requests with optional filters for location and vehicle type.
 * It supports pagination and populates related data such as driver details, vehicle details, and location information.
 * 
 * @param {string} userLocationId - The ID of the user's location.
 * @param {string} locationId - The ID of the location to filter requests (optional).
 * @param {string} vehicleType - The type of vehicle to filter requests (e.g., "2-wheeler", "4-wheeler") (optional).
 * @param {number} page - The page number for pagination (default: 1).
 * @param {number} limit - The number of requests per page (default: 10).
 * 
 * @returns {Object} - Contains an array of spare vehicle requests, the total count of requests, the current page, and the limit per page.
 * 
 * @throws {Error} - Throws an error if fetching spare vehicle requests fails.
 */
exports.getAllSpareVehicleRequestsService = async (userLocationId, locationId, search, vehicleType, page = 1, limit = 10) => {
    const query = {
        status: VEHICLE_REQUEST_STATUSES.PENDING,
        requestType: VEHICLE_REQUEST_TYPES.SPARE
    };
    if (!locationId && !userLocationId) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        query.locationId = bangaloreLocation._id;
    } else {
        if (locationId) {
            query.locationId = new mongoose.Types.ObjectId(locationId);
        } else {
            query.locationId = userLocationId;
        }
    }
    if (vehicleType) {
        query.vehicleType = vehicleType;
    }
    try {
        const pipeline = [
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'driver',
                },
            },
            { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
            ...(search ? [{
                $match: {
                    $or: [
                        { 'driver.name': { $regex: search, $options: 'i' } },
                        { 'driver.phone': { $regex: search, $options: 'i' } },
                    ]
                }
            }] : []),
            { $sort: { updatedAt: -1 } },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: parseInt(limit, 10) },
                    ],
                },
            },
        ];

        const result = await VehicleRequest.aggregate(pipeline);

        const total = result[0]?.metadata[0]?.total || 0;
        const spareVehicleRequests = result[0]?.data || [];

        const output = [];
        for (const spareRequest of spareVehicleRequests) {
            const primaryVehicleRequests = await VehicleRequest.find({
                requestType: VEHICLE_REQUEST_TYPES.PRIMARY,
                driverId: spareRequest.driverId,
                status: VEHICLE_REQUEST_STATUSES.PROCESSED,
                updatedAt: { $lt: spareRequest.updatedAt },
            })
                .sort({ updatedAt: -1 })
                .populate('vehicleId');

            if (primaryVehicleRequests.length > 0) {
                const primaryVehicle = primaryVehicleRequests[0];
                output.push({
                    spareRequest,
                    primaryVehicle: {
                        _id: primaryVehicle.vehicleId?._id || null,
                        vehicleNumber: primaryVehicle.vehicleId?.vehicleNumber || null,
                        vehicleType: primaryVehicle.vehicleId?.vehicleType || null,
                    },
                });
            }
        }

        return {
            spareVehicleRequests: output,
            total,
            page,
            limit,
        };

    } catch (error) {
        throw new Error('Failed to fetch spare Vehicle Requests: ' + error.message);
    }
};


/**
 * Allocates a spare vehicle to a request and updates statuses for primary and spare vehicles.
 * 
 * @param {string} requestId - The ID of the request to be processed.
 * @param {string} spareVehicleId - The ID of the vehicle being allocated as a spare vehicle.
 * 
 * @returns {Object} - The updated vehicle request document.
 * 
 * @throws {Error} - Throws an error if the operation fails.
 */
exports.allocateSpareVehicleService = async (requestId, VehicleId) => {
    const vehicleRequest = await VehicleRequest.findById(requestId);
    if (!vehicleRequest) {
        throw new Error('Vehicle request not found.');
    }
    const spareVehicle = await Vehicle.findOne({
        _id: VehicleId,
        status: VEHICLE_STATUSES.INACTIVE,
    });
    if (!spareVehicle) {
        throw new Error('vehicle not found.');
    }
    const primaryVehicleRequest = await VehicleRequest.findOne({
        driverId: vehicleRequest.driverId,
        status: VEHICLE_REQUEST_STATUSES.PROCESSED,
        requestType: VEHICLE_REQUEST_TYPES.PRIMARY,
    })
        .sort({ updatedAt: -1 })
        .populate('vehicleId');

    if (!primaryVehicleRequest || !primaryVehicleRequest.vehicleId) {
        throw new Error('Primary vehicle not found for the driver.');
    }
    const primaryVehicle = primaryVehicleRequest.vehicleId;

    primaryVehicle.status = VEHICLE_STATUSES.UNDER_REPAIR;
    await primaryVehicle.save();

    spareVehicle.status = VEHICLE_STATUSES.ACTIVE;
    await spareVehicle.save();

    vehicleRequest.status = VEHICLE_REQUEST_STATUSES.PROCESSED;
    vehicleRequest.vehicleId = VehicleId;
    await vehicleRequest.save();

    return vehicleRequest;
};