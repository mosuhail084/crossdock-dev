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

/**
 * Service to fetch all KYC requests from the database
 * @param {Object} queryParams - Query parameters for filtering, sorting, and pagination
 * @returns {Promise<Array>} - Array of KYC requests
 */
exports.fetchAllKycRequests = async (queryParams) => {
    const { status, page = 1, limit = 10 } = queryParams;

    const filters = {};
    if (status) filters.status = status;

    const options = {
        skip: (page - 1) * limit,
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
    };

    return await KycRequest.find(filters, null, options).populate('userID', 'name email phone');
};

/**
 * Fetch the KYC status for a given user ID.
 * @param {string} userID - The ID of the user whose KYC status is to be fetched.
 * @returns {Object|null} - Returns the KYC request object if found, otherwise null.
 * @throws {Error} - Throws an error if there is an issue during the database operation.
 */
exports.getKycStatusByUserID = async (userID) => {
    try {
        return await KycRequest.findOne({ userID });
    } catch (error) {
        throw new Error('Error while fetching KYC status');
    }
}

/**
 * Updates the status of a KYC request.
 */
exports.updateKycStatus = async (kycRequestId, status) => {
    return await KycRequest.findByIdAndUpdate(
        kycRequestId,
        { status },
        { new: true }
    );
};
