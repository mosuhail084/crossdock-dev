const mongoose = require('mongoose');
const { VEHICLE_TYPES, VEHICLE_STATUSES } = require('../config/constants');

/**
 * Vehicle Schema
 */
const vehicleSchema = new mongoose.Schema(
    {
        vehicleType: { 
            type: String, 
            required: true, 
            enum: Object.values(VEHICLE_TYPES),
        },
        vehicleNumber: { 
            type: String, 
            unique: true, 
            required: true 
        },
        rentalValue: { 
            type: Number, 
            required: true 
        },
        locationID: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Location', 
            required: true 
        },
        status: { 
            type: String, 
            enum: Object.values(VEHICLE_STATUSES),
            default: VEHICLE_STATUSES.INACTIVE,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);