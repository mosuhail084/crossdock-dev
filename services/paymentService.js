const User = require('../models/userModel');
const Location = require('../models/locationModel');
const bcrypt = require('bcrypt');
const { ROLES, VEHICLE_STATUSES, VEHICLE_TYPES, VEHICLE_REQUEST_STATUSES, VEHICLE_REQUEST_TYPES, PAYMENT_STATUSES } = require('../config/constants');
const Payment = require('../models/paymentModel');
const Vehicle = require('../models/vehicleModel');
const VehicleRequest = require('../models/vehicleRequestModel');
const { default: mongoose } = require('mongoose');


/**
 * Creates a new payment record in the database.
 *
 * @param {object} paymentData - The details of the payment to be created.
 * @param {string} paymentData.driverId - The ID of the driver associated with the payment.
 * @param {string} paymentData.vehicleId - The ID of the vehicle associated with the payment.
 * @param {string} paymentData.orderId - The unique order ID for the payment.
 * @param {number} paymentData.amount - The payment amount.
 * @param {string} [paymentData.transactionId] - The transaction ID for the payment (optional).
 * @param {string} [paymentData.status] - The status of the payment (default: 'completed').
 * @param {string} paymentData.locationId - The ID of the location associated with the payment.
 * @returns {Promise<object>} - The created payment record.
 * @throws {Error} - If there is an error during the record creation.
 */
exports.createPaymentRecord = async ({
    driverId,
    vehicleId,
    orderId,
    amount,
    transactionId,
    locationId,
    status = PAYMENT_STATUSES.COMPLETED
}) => {
    try {
        const paymentRecord = new Payment({
            driverId,
            vehicleId,
            orderId,
            amount,
            transactionId,
            locationId,
            status
        });

        const savedRecord = await paymentRecord.save();
        return savedRecord;
    } catch (error) {
        console.error('Error creating payment record:', error.message);
        throw new Error('Failed to create payment record');
    }
};

/**
 * Export payment data along with vehicle and driver details, handling both primary and spare vehicles.
 * 
 * @param {string} userLocationId - The location ID associated with the user making the request.
 * @param {string} locationId - The location ID specified in the query parameters (optional).
 * @returns {Promise<Object>} - An object containing the list of payment data and a success message.
 * 
 * @throws {Error} - Throws an error if the operation fails or the location is not found.
 */
exports.exportAllPaymentsService = async (userLocationId, locationId) => {
    const query = {
        status: VEHICLE_REQUEST_STATUSES.PROCESSED
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
            .populate('driverId', 'name')
            .populate('vehicleId', 'vehicleNumber vehicleType')
            .populate('paymentId', 'amount createdAt')
            .sort({ updatedAt: -1 });

        const result = [];
        for (const vehicleRequest of vehicleRequests) {
            const startDate = new Date(vehicleRequest.dateRange.startDate);
            const endDate = new Date(vehicleRequest.dateRange.endDate);
            const timeDiff = endDate - startDate;
            const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

            const spareVehicleRequest = await VehicleRequest.findOne({
                driverId: vehicleRequest.driverId._id,
                status: VEHICLE_REQUEST_STATUSES.PROCESSED,
                requestType: VEHICLE_REQUEST_TYPES.SPARE,
                updatedAt: { $gt: vehicleRequest.updatedAt },
            }).populate('vehicleId', 'vehicleNumber');

            result.push({
                "Payment Date": vehicleRequest?.paymentId?.createdAt || null,
                "No. of Days": days,
                "Name of Driver": vehicleRequest.driverId.name || null,
                "Vehicle Allotted": vehicleRequest.vehicleId.vehicleNumber || null,
                "Vehicle Type": vehicleRequest.vehicleId.vehicleType || null,
                "Spare Vehicle": spareVehicleRequest ? spareVehicleRequest.vehicleId.vehicleNumber : null,
                "Amount Paid": vehicleRequest?.paymentId?.amount || null
            });
        }
        return {
            result
        };
    } catch (error) {
        throw new Error('Failed to fetch payment data: ' + error.message);
    }
};

/**
 * Fetch payment data with optional filters, pagination, and date range filtering.
 * 
 * @param {string} userLocationId - The location ID associated with the user making the request.
 * @param {string} locationId - The location ID specified in the query parameters (optional).
 * @param {string} startDate - The start date in `YYYY-MM-DD` format (optional).
 * @param {string} endDate - The end date in `YYYY-MM-DD` format (optional).
 * @param {number} [page=1] - The page number for pagination (default is 1).
 * @param {number} [limit=10] - The number of records to fetch per page (default is 10).
 * 
 * @returns {Promise<Object>} - An object containing the payment data with pagination and total amount:
 * 
 * @throws {Error} - Throws an error if the operation fails:
 *   - "Bangalore location not found." if no Bangalore location is found.
 *   - "Failed to fetch payment data: <error_message>" if data retrieval fails.
 */
exports.getAllPaymentsService = async (userLocationId, locationId, search, startDate, endDate, page = 1, limit = 10) => {
    const query = {
        status: VEHICLE_REQUEST_STATUSES.PROCESSED,
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

    try {
        const skip = (page - 1) * limit;
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
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'vehicleId',
                    foreignField: '_id',
                    as: 'vehicle',
                },
            },
            { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'payments',
                    localField: 'paymentId',
                    foreignField: '_id',
                    as: 'paymentDetails',
                },
            },
            { $unwind: { path: '$paymentDetails', preserveNullAndEmptyArrays: true } },
            ...(startDate && endDate
                ? [
                    {
                        $match: {
                            'paymentDetails.createdAt': {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate),
                            },
                        },
                    },
                ]
                : []),
            ...(search
                ? [
                    {
                        $match: {
                            'driver.name': { $regex: search, $options: 'i' },
                        },
                    },
                ]
                : []),
            {
                $sort: { updatedAt: -1 },
            },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: skip },
                        { $limit: parseInt(limit, 10) },
                    ],
                },
            },
        ];

        const result = await VehicleRequest.aggregate(pipeline);

        const total = result[0]?.metadata[0]?.total || 0;
        const vehicleRequests = result[0]?.data || [];
        const paymentDetails = [];

        for (const vehicleRequest of vehicleRequests) {
            const startDate = new Date(vehicleRequest.dateRange.startDate);
            const endDate = new Date(vehicleRequest.dateRange.endDate);
            const timeDiff = endDate - startDate;
            const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

            const spareVehicleRequest = await VehicleRequest.findOne({
                driverId: vehicleRequest.driverId._id,
                status: VEHICLE_REQUEST_STATUSES.PROCESSED,
                requestType: VEHICLE_REQUEST_TYPES.SPARE,
                updatedAt: { $gt: vehicleRequest.updatedAt },
            })
                .populate('vehicleId', 'vehicleNumber')
                .populate('paymentId', 'amount createdAt');

            const driverName = vehicleRequest.driver ? vehicleRequest.driver.name : null;
            paymentDetails.push({
                'Payment Date': vehicleRequest?.paymentDetails?.createdAt || null,
                'No. of Days': days,
                'Name of Driver': driverName,
                'Vehicle Allotted': vehicleRequest?.vehicle?.vehicleNumber || null,
                'Vehicle Type': vehicleRequest?.vehicle?.vehicleType || null,
                'Spare Vehicle': spareVehicleRequest ? spareVehicleRequest.vehicleId.vehicleNumber : null,
                'Amount Paid': vehicleRequest?.paymentDetails?.amount || null,
            });
        }

        const totalAmount = paymentDetails.reduce(
            (sum, record) => sum + (record['Amount Paid'] || 0),
            0
        );

        return {
            result: paymentDetails,
            totalAmount,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        throw new Error('Failed to fetch payment data: ' + error.message);
    }
};

/**
 * Creates or updates a payment record based on the provided order ID.
 *
 * @param {string} locationId - The ID of the location associated with the payment.
 * @param {ObjectId} driverId - The ID of the driver associated with the payment.
 * @param {string} orderId - The unique order ID for the payment.
 * @param {string} status - The status of the payment.
 * @param {string} cfOrderId - The transaction ID from the payment gateway.
 * @param {string} transactionId - The transaction ID from the payment gateway.
 * @param {number} amount - The payment amount.
 * @param {ObjectId} vehicleId - The ID of the vehicle associated with the payment.
 * @param {Date} [paymentAt] - The date and time when the payment was made.
 * @returns {Promise<Payment>} - The created or updated payment record.
 */
exports.createOrUpdatePaymentRecord = async (locationId, driverId, orderId, status, cfOrderId, transactionId, amount, vehicleId, paymentAt) => {
    const filter = { orderId };
    const paymentData = {
        locationId: new mongoose.Types.ObjectId(locationId),
        driverId,
        orderId,
        status,
        cfOrderId,
        transactionId,
        amount,
        vehicleId,
        paymentAt
    };

    const paymentRecord = await Payment.findOneAndUpdate(
        filter,                 // Only use orderId to check if the document exists
        { $set: paymentData },  // Update the fields with the provided data
        { upsert: true, new: true } // Insert if not found, return the updated/inserted document
    );

    return paymentRecord;
};
