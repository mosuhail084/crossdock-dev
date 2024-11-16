require('dotenv').config();
const axios = require('axios');
const safeJsonStringify = require('safe-json-stringify');

const API_KEY = process.env.CASHFREE_API_KEY;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const BASE_URL = process.env.CASHFREE_ENV === 'TEST'
  ? 'https://sandbox.cashfree.com/pg/orders'
  : 'https://api.cashfree.com/pg/orders';

const createOrder = async (orderId, orderAmount, customerEmail) => {
  const orderData = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: 'INR',
    customer_details: {
      customer_email: customerEmail,
    },
  };

  try {
    const response = await axios.post(BASE_URL, safeJsonStringify(orderData), {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': API_KEY,
        'x-client-secret': SECRET_KEY,
      },
    });
    console.log( response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error.response ? error.response.data : error.message);
    throw error;
  }
};

module.exports = { createOrder };