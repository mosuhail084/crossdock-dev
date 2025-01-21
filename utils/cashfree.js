require('dotenv').config();
const axios = require('axios');
const safeJsonStringify = require('safe-json-stringify');
const { Cashfree } = require('cashfree-pg');
const { custom } = require('joi');
const { PAYMENT_STATUSES } = require('../config/constants');

Cashfree.XClientId = process.env.CASHFREE_API_KEY;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = process.env.NODE_ENV === 'TEST'
  ? Cashfree.Environment.SANDBOX
  : Cashfree.Environment.PRODUCTION;


/**
 * Creates a new order on the Cashfree payment gateway.
 *
 * @param {string} orderId - Unique identifier for the order.
 * @param {number} orderAmount - The amount of the order in INR.
 * @param {object} customerDetails - Customer details: name, email, phone.
 * @returns {Promise<object>} - The newly created order.
 * @throws {Error} - If there is an error creating the order.
 */
const createOrder = async (orderId, orderAmount, customerDetails, customFields) => {
  const request = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: 'INR',
    customer_details: customerDetails,
    order_meta: {

    },
    order_tags: {
      vehicle_request_id: customFields.vehicleRequestId,
      vehilce_id: customFields.vehicleId
    },
  };

  return Cashfree.PGCreateOrder("2023-08-01", request)
    .then(response => {
      if (response.data) {
        return response.data;
      }
      console.log('Order creation failed:', response);
      throw new Error(`Order creation failed: ${response.data.message}`);
    })
    .catch(error => {
      console.error('Error:', error.response?.data?.message || error.message);
      throw error;
    });
};

/**
 * Fetches the payment status from Cashfree.
 *
 * @param {string} orderId - The unique identifier for the order.
 * @returns {Promise<object>} - The payment status details.
 * @throws {Error} - If there is an error fetching the payment status.
 */
const getPaymentStatus = async (orderId) => {
  try {
    const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    const payments = response?.data || [];
    if (!Array.isArray(payments) || payments.length === 0) {
      throw new Error("No payment transactions found for the provided order ID.");
    }

    // Determine the overall order status
    let orderStatus;
    if (payments.some(transaction => transaction.payment_status === "SUCCESS")) {
      orderStatus = PAYMENT_STATUSES.SUCCESS;
    } else if (payments.some(transaction => transaction.payment_status === "PENDING")) {
      orderStatus = PAYMENT_STATUSES.PENDING;
    } else {
      orderStatus = PAYMENT_STATUSES.FAILED;
    }

    const lastTransaction = payments[payments.length - 1];

    // Return the overall status and details of the last transaction
    return {
      status: orderStatus,
      cfOrderId: lastTransaction.order_id,
      transactionId: lastTransaction.cf_payment_id,
      amount: lastTransaction.order_amount,
      // orderMeta: lastTransaction.order_meta,
      // orderTags: lastTransaction.order_tags,
      paymentAt: lastTransaction.payment_time,
    };
  } catch (error) {
    console.error('Error fetching payment status:', error.response ? error.response.data : error.message);
    throw error;
  }
};

module.exports = { createOrder, getPaymentStatus };