const KycRequest = require('../models/kycRequestModel.js');

/**
 * Create a new KYC request.
 * @param {Object} kycData - Data for the KYC request.
 * @returns {Promise<Object>} - Created KYC request.
 */
exports.createKycRequest = async (kycData) => {
    const kycRequest = new KycRequest(kycData);
    await kycRequest.save();
    return kycRequest;
};
