const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Vehicle Request Schema
 */
const vehicleRequestSchema = new Schema({
    driverID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleID: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    status: { 
        type: String, 
        enum: ['active', 'pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    dateRange: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
    },
    requestType: { 
        type: String, 
        enum: ['primary', 'spare'], 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('VehicleRequest', vehicleRequestSchema);