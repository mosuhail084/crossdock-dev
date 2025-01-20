const User = require('../models/userModel');
const Location = require('../models/locationModel');
const bcrypt = require('bcrypt');
const { ROLES, VEHICLE_STATUSES, VEHICLE_TYPES, VEHICLE_REQUEST_STATUSES, VEHICLE_REQUEST_TYPES } = require('../config/constants');
const Payment = require('../models/paymentModel');
const Vehicle = require('../models/vehicleModel');
const VehicleRequest = require('../models/vehicleRequestModel');

/**
 * Create a new user.
 * @param {Object} userData - Data for the new user.
 * @returns {Promise<Object>} - Created user.
 */
exports.createUser = async (userData) => {
    const user = new User(userData);
    await user.save();
    return user;
};

/**
 * Service to add a new Admin.
 * @param {object} adminData - Admin details (email, password, name, locationId).
 * @returns {Promise<object>} - The newly created Admin user.
 * @throws {Error} - Throws an error if email is already in use or locationId is invalid.
 */
exports.createAdmin = async ({ email, password, name, locationId, phone }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('Email is already in use');
        error.statusCode = 400;
        throw error;
    }

    const location = await Location.findById(locationId);
    if (!location) {
        const error = new Error('Invalid Location ID');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        email,
        password: hashedPassword,
        name,
        role: ROLES.ADMIN,
        phone,
        locationId: locationId,
        isActive: true,
    });

    return await newUser.save();
};

/**
 * Updates the user's location based on the approved KYC request.
 * @param {ObjectId} userId - The user's ID.
 * @param {ObjectId} locationId - The location ID to update.
 * @returns {Promise<Object>} - The updated user object.
 */
exports.updateUserLocation = async (userId, locationId) => {
    return await User.findByIdAndUpdate(
        userId,
        { locationId: locationId },
        { new: true }
    );
};

/**
 * Service to update the password for an admin.
 * It checks if the old password is correct and updates the password in the database.
 * 
 * @param {string} adminId - The ID of the admin whose password is to be updated.
 * @param {string} oldPassword - The current password of the admin.
 * @param {string} password - The new password the admin wants to set.
 * @returns {Object} - The updated admin object after the password change.
 * @throws {Object} - Throws an error if any validation fails or if there is an issue during the update.
 */
exports.updatePasswordforadmin = async (adminId, oldPassword, password) => {
    const admin = await User.findById(adminId);
    if (!admin) {
        throw { statusCode: 404, message: 'Admin not found.' };
    }
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
        throw { statusCode: 400, message: 'Old password is incorrect.' };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    admin.password = hashedPassword;
    await admin.save();
    return admin;
};

/**
 * Fetches dashboard statistics filtered by location.
 * @param {Object} queryParam - Query parameters containing locationId (optional).
 * @param {ObjectId} userLocation - The location ID of the user (default if locationId is not provided).
 * @returns {Object} - Aggregated dashboard statistics.
 */
exports.getDashboardStats = async (queryParam, userLocation) => {
    try {
        const { locationId } = queryParam;

        const resolvedLocationId = locationId || userLocation;
        if (!resolvedLocationId) {
            const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
            if (!bangaloreLocation) {
                throw new Error('Bangalore location not found.');
            }
            userLocation = bangaloreLocation._id;
        }

        const locationFilter = { locationId: resolvedLocationId };

        const totalPaymentReceived = await Payment.aggregate([
            { $match: locationFilter },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const driverCount = await User.countDocuments({ role: ROLES.DRIVER, locationId: resolvedLocationId });

        const totalVehicles = await Vehicle.countDocuments(locationFilter);
        const activeVehicles = await Vehicle.countDocuments({ ...locationFilter, status: VEHICLE_STATUSES.ACTIVE });
        const inactiveVehicles = await Vehicle.countDocuments({ ...locationFilter, status: VEHICLE_STATUSES.INACTIVE });
        const spareVehicles = await Vehicle.countDocuments({ ...locationFilter, status: VEHICLE_STATUSES.SPARE });
        const underRepairVehicles = await Vehicle.countDocuments({ ...locationFilter, status: VEHICLE_STATUSES.UNDER_REPAIR });

        const twoWheelerCount = await Vehicle.countDocuments({
            ...locationFilter,
            vehicleType: VEHICLE_TYPES.TWO_WHEELER
        });
        const threeWheelerCount = await Vehicle.countDocuments({
            ...locationFilter,
            vehicleType: { $in: [VEHICLE_TYPES.THREE_WHEELER_5_8, VEHICLE_TYPES.THREE_WHEELER_10] }
        });
        const fourWheelerCount = await Vehicle.countDocuments({
            ...locationFilter,
            vehicleType: VEHICLE_TYPES.FOUR_WHEELER
        });

        return {
            paymentReceived: totalPaymentReceived[0]?.total || 0,
            driverCount,
            totalVehicles,
            activeVehicles,
            inactiveVehicles,
            spareVehicles,
            underRepairVehicles,
            twoWheelerCount,
            threeWheelerCount,
            fourWheelerCount,
        };
    } catch (error) {
        throw new Error(`Failed to fetch dashboard statistics: ${error.message}`);
    }
};

/**
 * Service for switching a user's status (active/inactive).
 * This function toggles the `isActive` status of the specified user.
 *
 * @param {string} userId - The ID of the user whose status needs to be switched.
 * @returns {Promise<Object>} - The updated user and a success message.
 * @throws {Error} - If the user is not found or an error occurs during the operation.
 */
exports.switchUserStatusService = async (userId, status) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }
    user.isActive = status;
    const updatedUser = await user.save();
    return {
        message: 'User status updated successfully.',
        user: updatedUser,
    };
};

/**
 * Fetches a paginated list of drivers with optional filters and their allotted vehicle.
 * 
 * Retrieves drivers filtered by `status` (isActive) and location. Includes the latest 
 * processed vehicle request's `vehicleNumber` for each driver, or `null` if none exist.
 * 
 * @param {Object} queryParams - Filtering and pagination parameters.
 * @param {string} queryParams.status - Filter by active status (true/false).
 * @param {number} [queryParams.page=1] - Page number for pagination.
 * @param {number} [queryParams.limit=10] - Number of items per page.
 * @param {string} [queryParams.userLocationId] - Authenticated user's location ID.
 * @param {string} [queryParams.locationId] - Specific location ID to filter by.
 * 
 * @returns {Promise<Object>} - Paginated list of drivers including:
 *                              - Driver details (`_id`, `name`, `isActive`, `locationId`).
 *                              - `allottedVehicle`: Latest processed vehicle request's `vehicleNumber`.
 *                              - Pagination metadata (`total`, `page`, `limit`).
 *                              - Success message.
 * 
 * @throws {Error} - For database issues or missing default location.
 */
exports.fetchAllDriversService = async ({ status, search, page = 1, limit = 10, userLocationId, locationId }) => {
    const query = {
        role: ROLES.DRIVER
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

    if (status != undefined) {
        query.isActive = status === 'true' ? true : false;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const total = await User.countDocuments(query);

        const drivers = await User.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit, 10))
            .select(' -otp -otpExpiry')
            .populate('locationId', 'cityName');

        const driverIds = drivers.map(driver => driver._id);
        const vehicleRequests = await VehicleRequest.aggregate([
            { $match: { driverId: { $in: driverIds }, status: VEHICLE_REQUEST_STATUSES.PROCESSED } },
            { $sort: { updatedAt: -1 } },
            {
                $group: {
                    _id: "$driverId",
                    latestRequest: { $first: "$$ROOT" }
                }
            }
        ]);

        const vehicleRequestMap = {};
        vehicleRequests.forEach(request => {
            vehicleRequestMap[request._id.toString()] = request.latestRequest;
        });

        const driversWithVehicles = await Promise.all(
            drivers.map(async (driver) => {
                const vehicleRequest = vehicleRequestMap[driver._id.toString()];
                let vehicleAlloted = null;
                if (vehicleRequest && vehicleRequest.vehicleId) {
                    const vehicle = await Vehicle.findById(vehicleRequest.vehicleId).select('vehicleNumber vehicleType rentalValue status');
                    if (vehicle) {
                        vehicleAlloted = vehicle;
                    }
                }
                return {
                    ...driver.toObject(),
                    vehicleAlloted: vehicleAlloted || null
                };
            })
        );

        return {
            drivers: driversWithVehicles,
            total,
            page,
            limit,
            message: 'Drivers fetched successfully.',
        };
    } catch (error) {
        throw new Error('Failed to fetch drivers: ' + error.message);
    }
};

/**
 * Fetches payment history for a specific driver, including vehicle details and transaction information.
 * 
 * @param {ObjectId} driverId - The ID of the driver whose payment history is being fetched.
 * @returns {Promise<Array>} - Returns an array of payment history with vehicle details, amount, and transactionId.
 */
exports.getPaymentHistoryService = async (driverId) => {
    try {
        const isuser = await VehicleRequest.find({ driverId: driverId })
        if (isuser.length == 0) {
            throw new Error('No User Found');
        }
        const paymentHistory = await VehicleRequest.find({ driverId: driverId, status: VEHICLE_REQUEST_STATUSES.PROCESSED })
            .populate('vehicleId', 'vehicleNumber vehicleType')
            .populate('paymentId', 'amount transactionId')
            .sort({ 'dateRange.startDate': -1 });
        if (paymentHistory.length == 0) {
            throw new Error('No Payments made yet');
        }
        const totalAmount = paymentHistory.reduce((sum, request) => {
            if (request.paymentId && request.paymentId.amount) {
                return sum + request.paymentId.amount;
            }
            return sum;
        }, 0);
        return {
            totalAmount,
            paymentHistory
        };
    } catch (error) {
        throw new Error('Error fetching payment history: ' + error.message);
    }
};

/**
 * Fetches the allocated primary and spare vehicles for a specific user (driver), 
 * including vehicle details and payment information.
 * 
 * @param {ObjectId} userId - The ID of the user (driver) whose allocated vehicles are being fetched.
 * @returns {Promise<Object>} - Returns an object containing the most recent primary and spare vehicle requests:
 *                               - `primary`: The primary vehicle request details or `null` if none exist.
 *                               - `spare`: The spare vehicle request details or `null` if none exist.
 */
exports.getAllocatedVehiclesService = async (userId) => {
    try {
        const primaryVehicleRequest = await VehicleRequest.findOne({
            driverId: userId,
            requestType: VEHICLE_REQUEST_TYPES.PRIMARY,
            status: VEHICLE_REQUEST_STATUSES.PROCESSED
        })
            .sort({ createdAt: -1 })
            .populate('vehicleId', 'vehicleNumber vehicleType')
            .populate('paymentId', 'amount transactionId');

        if (!primaryVehicleRequest) {
            return { primary: null, secondary: null };
        }
        const secondaryVehicleRequest = await VehicleRequest.findOne({
            driverId: userId,
            requestType: VEHICLE_REQUEST_TYPES.SPARE,
            status: VEHICLE_REQUEST_STATUSES.PROCESSED,
            createdAt: { $gt: primaryVehicleRequest.createdAt }
        })
            .sort({ createdAt: -1 })
            .populate('vehicleId', 'vehicleNumber vehicleType')
            .populate('paymentId', 'amount transactionId');

        return { primary: primaryVehicleRequest, spare: secondaryVehicleRequest || null };

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Fetch and export data grouped by users.
 * @returns {Array} - Data grouped by users.
 */
exports.exportAllDataService = async (userLocationId, locationId) => {
    try {
        const query = {
            role: ROLES.DRIVER
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
        const users = await User.find(query, { name: 1, phone: 1, role: 1, isActive: 1, locationId: 1 })
            .populate('locationId', 'cityName');

        const userData = await Promise.all(
            users.map(async (user) => {
                const vehicleRequests = await VehicleRequest.find({ driverId: user._id }, { _id: 0, createdAt: 0, updatedAt: 0, __v: 0, driverId: 0 })
                    .populate('vehicleId', 'vehicleNumber rentalValue status -_id')
                    .populate('locationId', 'cityName')
                    .populate('paymentId', 'amount status date transactionId -_id ');

                return {
                    name: user.name || "-",
                    phone: user.phone || "-",
                    role: user.role,
                    isActive: user.isActive,
                    locationId: user.locationId || "-",
                    vehicleRequests,
                };
            })
        );
        return userData;
    } catch (error) {
        throw new Error(`Error fetching data: ${error.message}`);
    }
};

/**
 * Deletes a driver from the system by their driver ID.
 * 
 * This service checks if the driver exists, verifies their role, and deletes the driver if they exist and are a driver.
 * 
 * @param {ObjectId} driverId - The ID of the driver to be deleted.
 * @returns {Promise<Object>} - Returns a success message if the driver is deleted successfully or throws an error if not found.
 * 
 * @throws {Error} - Throws an error if the driver is not found or if there is an issue during deletion.
 */
exports.deleteDriverService = async (driverId) => {
    try {
        const driver = await User.find({ _id: driverId, role: ROLES.DRIVER });
        if (driver.length == 0) {
            throw new Error('Driver not found');
        }
        await User.findByIdAndDelete(driverId);
        return {
            success: true,
            message: 'Driver deleted successfully',
        };
    } catch (error) {
        throw new Error('Error deleting driver: ' + error.message);
    }
};

/**
 * Exports a list of drivers for a given location.
 * 
 * This service retrieves drivers based on the user's location or a specified location, 
 * along with their vehicle allocation status and other details. The results are sorted 
 * by the creation date of the vehicle allotment, prioritizing the most recent assignments.
 * 
 * @param {ObjectId} userLocationId - The location ID associated with the logged-in user.
 * @param {ObjectId} locationId - An optional location ID to filter drivers for a specific location.
 * @returns {Promise<Object>} - Returns an object containing the list of drivers and a success message.
 * 
 * @throws {Error} - Throws an error if the location is not found or if there is an issue during data retrieval.
 */
exports.exportDriversService = async (userLocationId, locationId) => {
    const query = {
        role: ROLES.DRIVER
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
        const total = await User.countDocuments(query);
        const drivers = await User.find(query)

        const driverIds = drivers.map(driver => driver._id);
        const vehicleRequests = await VehicleRequest.aggregate([
            { $match: { driverId: { $in: driverIds }, status: VEHICLE_REQUEST_STATUSES.PROCESSED } },
            { $sort: { updatedAt: -1 } },
            {
                $group: {
                    _id: "$driverId",
                    latestRequest: { $first: "$$ROOT" }
                }
            }
        ]);
        const vehicleRequestMap = {};
        vehicleRequests.forEach(request => {
            vehicleRequestMap[request._id.toString()] = request.latestRequest;
        });
        const driversWithVehicles = await Promise.all(
            drivers.map(async (driver) => {
                const vehicleRequest = vehicleRequestMap[driver._id.toString()];
                if (vehicleRequest && vehicleRequest.vehicleId) {
                    const vehicle = await Vehicle.findById(vehicleRequest.vehicleId).select('vehicleNumber vehicleType createdAt');
                    if (vehicle) {
                        return {
                            "Name of driver": driver.name,
                            "Account status": driver.isActive,
                            "Contact no.": driver.phone,
                            "Vehicle allotted": vehicle.vehicleNumber,
                            "Vehicle type": vehicle.vehicleType,
                            "createdAt": vehicle.createdAt
                        };
                    }
                }
                return {
                    "Name of driver": driver.name,
                    "Account status": driver.isActive,
                    "Contact no.": driver.phone,
                    "Vehicle allotted": null,
                    "Vehicle type": null,
                    "createdAt": null
                };
            })
        );
        const validDriversWithVehicles = driversWithVehicles.filter(Boolean);
        validDriversWithVehicles.sort((a, b) => {
            if (!a.createdAt && !b.createdAt) return 0;
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        const Drivers = validDriversWithVehicles.map(({ createdAt, ...rest }) => rest);
        return {
            drivers: Drivers,
            total: total,
            message: 'Drivers exported successfully.',
        };
    } catch (error) {
        throw new Error('Failed to fetch drivers: ' + error.message);
    }
};