const mongoose = require('mongoose');
const { VEHICLE_REQUEST_STATUSES, VEHICLE_TYPES, VEHICLE_REQUEST_TYPES } = require('../config/constants');
const Schema = mongoose.Schema;

/**
 * Vehicle Request Schema
 */
const vehicleRequestSchema = new Schema({
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    vehicleType: {
        type: String,
        required: true,
        enum: Object.values(VEHICLE_TYPES),
    },
    status: {
        type: String,
        enum: Object.values(VEHICLE_REQUEST_STATUSES),
        default: VEHICLE_REQUEST_STATUSES.PENDING,
    },
    dateRange: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
    },
    requestType: {
        type: String,
        enum: Object.values(VEHICLE_REQUEST_TYPES),
        default: VEHICLE_REQUEST_TYPES.PRIMARY,
    },
    disabledAt: {
        type: Date
    },
    orderId: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('VehicleRequest', vehicleRequestSchema);