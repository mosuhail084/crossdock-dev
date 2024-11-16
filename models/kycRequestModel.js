const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * KYC Request Schema
 */
const kycRequestSchema = new Schema({
    userID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    uploadedDocuments: {
        userPhoto: { type: String, required: true },
        panCard: { type: String, required: true },
        aadharCard: { type: String, required: true },
        driversLicense: { type: String, required: true },
    },
    dateRequested: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('KycRequest', kycRequestSchema);