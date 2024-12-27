const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Payment Schema
 */
const paymentSchema = new Schema({
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    amount: { type: Number, required: true, min: 0 },
    transactionId: { type: String, required: false, unique: true },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    date: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Payment', paymentSchema);
