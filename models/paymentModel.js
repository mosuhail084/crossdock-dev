const mongoose = require('mongoose');
const { PAYMENT_STATUSES } = require('../config/constants');
const Schema = mongoose.Schema;

/**
 * Payment Schema
 */
const paymentSchema = new Schema({
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    orderId: { type: String, required: true, unique: true },
    cfOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    transactionId: { type: String, required: false, unique: true },
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUSES),
        default: PAYMENT_STATUSES.SUCCESS,
    },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    paymentAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Payment', paymentSchema);
