const { VEHICLE_REQUEST_STATUSES, PAYMENT_STATUSES, VEHICLE_STATUSES } = require("../config/constants");
const { updateVehicleRequestStatus, updateOrderId, updateVehicleStatus, getVehicleRequestByOrderId } = require("../services/vehicleService");
const { createOrder, getPaymentStatus } = require("../utils/cashfree");
const { successResponse, errorResponse } = require("../utils/responseUtils");
const { exportAllPaymentsService, getAllPaymentsService, createOrUpdatePaymentRecord } = require('../services/paymentService');
const { create } = require("../models/userModel");

/**
 * Creates a payment order on the payment gateway using the provided order details.
 *
 * This function extracts order details from the request body and user details from the request object.
 * It then calls the `createOrder` function with the orderId, orderAmount, and customer details to 
 * create a payment order. If successful, it sends a JSON response with the order details and a success message.
 * If there is an error, it sends an error response with the error message.
 *
 * @param {Object} req - Express request object containing the order details in the body and user details.
 * @param {Object} res - Express response object used to send the success or error response.
 * @returns {Promise<void>} - Returns a JSON response with the order details or an error message.
 */
exports.createPaymentOrder = async (req, res) => {
    const { orderId, orderAmount, vehicleRequestId, vehicleId } = req.body;

    const customerDetails = {
        customer_name: req.user.name,
        customer_phone: req.user.phone,
        customer_id: req.user.userId
    };

    const customFields = { vehicleRequestId, vehicleId };
    console.log(customFields);

    try {
        const orderResponse = await createOrder(orderId, orderAmount, customerDetails, customFields);
        await updateOrderId(vehicleRequestId, orderId);

        res.json(successResponse(orderResponse, 'Order created successfully!'));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
};

/**
 * Export all payment records with related driver and vehicle details.
 * 
 * This controller handles the HTTP request for exporting all payment records. It calls the `exportAllPaymentsService` 
 * to fetch the payment details, including the payment date, driver information (name), vehicle details 
 * (vehicle type, vehicle number), spare vehicle details if available, and payment amount.
 * 
 * @param {Object} req - The Express request object, containing the user's location ID and optional query parameters.
 * @param {Object} res - The Express response object used to send the success or error response.
 * @returns {Promise<Object>} - Returns a JSON response with the payment records data and a success message.
 * 
 * @throws {Error} - Throws an error if the payment export fails or there is an issue with the request.
 */
exports.exportAllPayments = async (req, res) => {
    try {
        const userLocationId = req.user.locationId;
        const { locationId } = req.query;
        const data = await exportAllPaymentsService(userLocationId, locationId);
        return res.status(200).json(successResponse(data.result, 'exported all payments successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Controller to fetch all payment data with optional filters, pagination, and date range filtering.
 * 
 * @param {Object} req - The request object containing query parameters:
 *   - `locationId`: The location ID to filter by (optional).
 *   - `startDate`: The start date for filtering payments (optional).
 *   - `endDate`: The end date for filtering payments (optional).
 *   - `page`: The page number for pagination (optional, default is 1).
 *   - `limit`: The number of records per page (optional, default is 10).
 * 
 * @param {Object} res - The response object used to send the API response.
 * 
 * @returns {Object} - The response object containing:
 *   - A success message with the retrieved payment data if the operation is successful.
 *   - An error message if the operation fails.
 */
exports.getAllPayments = async (req, res) => {
    try {
        const userLocationId = req.user.locationId;
        const { locationId, search, startDate, endDate, page, limit } = req.query;
        const data = await getAllPaymentsService(userLocationId, locationId, search, startDate, endDate, page, limit);
        return res.status(200).json(successResponse(data, 'retrieved all payments successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
    }
};

/**
 * Verifies the payment status using the given order ID.
 *
 * This function fetches the payment status from the payment gateway and updates the vehicle request status if the payment is successful.
 * It also saves the payment record with the order details.
 *
 * @param {Object} req - Express request object containing the order ID in the body.
 * @param {Object} res - Express response object used to send the success or error response.
 * @returns {Promise<void>} - Responds with a JSON success message if the payment is verified successfully, or an error message if verification fails.
 *
 * @throws {Error} - If there is an error fetching the payment status or updating the vehicle request.
 */
exports.verifyPayment = async (req, res) => {
    const { orderId } = req.body;

    try {
        const paymentDetails = await getPaymentStatus(orderId);
        const vehicleRequest = await getVehicleRequestByOrderId(orderId);
        
        const { status, cfOrderId, transactionId, amount, paymentAt } = paymentDetails;
        
        const paymentRecord = await createOrUpdatePaymentRecord(
            req.user.locationId,
            req.user.userId,
            orderId,
            status,
            cfOrderId,
            transactionId,
            amount,
            vehicleRequest.vehicleId,
            paymentAt
        );

        if (status === PAYMENT_STATUSES.SUCCESS) {
            await updateVehicleRequestStatus(vehicleRequest._id, VEHICLE_REQUEST_STATUSES.PROCESSED, paymentRecord._id);
            await updateVehicleStatus(vehicleRequest.vehicleId, VEHICLE_STATUSES.ACTIVE);
        }

        return res.status(200).json(successResponse({ status, amount }, 'Payment verified successfully'));
    } catch (error) {
        console.error('Error verifying payment:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.response ? error.response.data : error.message,
        });
    }
};