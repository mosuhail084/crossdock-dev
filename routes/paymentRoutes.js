const express = require('express');
const { createPaymentOrder, exportAllPayments, getAllPayments, verifyPayment } = require('../controllers/paymentController');
const { checkPermission } = require('../middleware/checkPermission');
const validateRequest = require('../middleware/validateRequest');
const { getAllPaymentsSchema } = require('../validations/paymentValidation');
const router = express.Router();

/**
 * @swagger
 * /v1/payment/create-order:
 *   post:
 *     summary: Create a new payment order.
 *     description: Creates a payment order using the provided order details, including order ID, order amount, and customer information.
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Unique identifier for the order.
 *               orderAmount:
 *                 type: number
 *                 description: The amount for the order in INR.
 *               vehicleRequestId:
 *                 type: string
 *                 description: ID of the vehicle request associated with the order.
 *               vehicleId:
 *                 type: string
 *                 description: ID of the vehicle associated with the order.
 *     responses:
 *       200:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/create-order', createPaymentOrder);

/**
 * @swagger
 * /v1/payment/export-all-payments:
 *   get:
 *     summary: Export all payment records.
 *     description: Retrieves a list of payment records with details such as payment date, number of days, driver information, vehicle details, spare vehicle information (if applicable), and the amount paid.
 *     tags:
 *       - Payments
 *       - Web App
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The optional location ID to filter payments. If not provided, defaults to the user's location.
 *     responses:
 *       200:
 *         description: Payment records retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Exported all payments successfully."
 *               data:
 *                 - Payment Date: "2024-06-14T10:00:00.000Z"
 *                   No. of Days: 5
 *                   Name of Driver: "Rishi"
 *                   Vehicle Allotted: "KA 8C 4444"
 *                   Vehicle Type: "2-wheeler"
 *                   Spare Vehicle: null
 *                   Amount Paid: 1400
 *                 - Payment Date: "2024-06-15T12:00:00.000Z"
 *                   No. of Days: 3
 *                   Name of Driver: "John"
 *                   Vehicle Allotted: "KA 9A 1234"
 *                   Vehicle Type: "4-wheeler"
 *                   Spare Vehicle: "KA 9B 5678"
 *                   Amount Paid: 2500
 *       400:
 *         description: Invalid location ID format.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid location ID format."
 *       404:
 *         description: No payment records found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No payment records found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/export-all-payments', checkPermission('GET_EXPORTED_DATA'), exportAllPayments);

/**
 * @swagger
 * /v1/payment/get-all-payments:
 *   get:
 *     summary: Retrieve all payment records with optional filters and pagination.
 *     description: Retrieves a list of payment records with details such as payment date, number of days, driver information, vehicle details, spare vehicle information (if applicable), and the amount paid. Supports optional filtering by location ID, start date, and end date, as well as pagination.
 *     tags:
 *       - Payments
 *       - Web App
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *         description: The optional location ID to filter payments. If not provided, defaults to the user's location.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter the records by a search term, which can match against the driver's name.
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: The optional start date to filter payments by.
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: The optional end date to filter payments by.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination. Default is 1.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of records per page. Default is 10.
 *     responses:
 *       200:
 *         description: Payment records retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Retrieved all payments successfully."
 *               data:
 *                 - Payment Date: "2024-06-14T10:00:00.000Z"
 *                   No. of Days: 5
 *                   Name of Driver: "user suhail"
 *                   Vehicle Allotted: "XYZ7810"
 *                   Vehicle Type: "3-wheeler (10)"
 *                   Spare Vehicle: "XYZ7890"
 *                   Amount Paid: 1400
 *               totalAmount: 7600
 *               total: 6
 *               page: 1
 *               limit: 10
 *               totalPages: 1
 *       400:
 *         description: Invalid query parameter(s).
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid query parameter(s)."
 *       404:
 *         description: No payment records found matching the filter criteria.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No payment records found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/get-all-payments', checkPermission('GET_ALL_PAYMENTS'), validateRequest(getAllPaymentsSchema), getAllPayments);

/**
 * @swagger
 * /v1/payment/verify-payment:
 *   post:
 *     summary: Verifies a payment using the given order ID.
 *     description: Verifies a payment using the given order ID and updates the vehicle request status if the payment is successful.
 *     tags:
 *       - Payments
 *       - Web App
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 required: true
 *                 description: The order ID to verify the payment with.
 *     responses:
 *       200:
 *         description: Payment verified successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Payment verified successfully."
 *               data:
 *                 status: "SUCCESS"
 *                 amount: 1400
 *       400:
 *         description: Invalid request body.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid request body."
 *       404:
 *         description: Order ID not found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Order ID not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.post('/verify-payment', verifyPayment);


module.exports = router;