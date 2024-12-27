const { createOrder } = require("../utils/cashfree");
const { successResponse, errorResponse } = require("../utils/responseUtils");

exports.createPaymentOrder = async (req, res) => {
    const { orderId, orderAmount } = req.body;

    try {
        const orderResponse = await createOrder(orderId, orderAmount, req.user.userId);
        res.json(successResponse(orderResponse, 'Order created successfully!'));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}