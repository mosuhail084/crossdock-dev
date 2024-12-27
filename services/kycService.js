const { KYC_STATUS } = require('../config/constants.js');
const { generateSignedUrl } = require('../helpers/s3Helper.js');
const KycRequest = require('../models/kycRequestModel.js');
const Location = require('../models/locationModel.js');

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
exports.fetchAllKycRequests = async (queryParams, userLocation) => {
    const { status, locationId, page = 1, limit = 10 } = queryParams;

    if (!userLocation) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        userLocation = bangaloreLocation._id;
    }

    const query = { locationId: locationId || userLocation, status: status || KYC_STATUS.PENDING };

    const kycRequests = await KycRequest.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .populate('userId', 'name email phone');

    for (const kycRequest of kycRequests) {
        if (kycRequest.uploadedDocuments) {
            for (const [key, s3Key] of Object.entries(kycRequest.uploadedDocuments)) {
                kycRequest.uploadedDocuments[key] = s3Key
                    ? await generateSignedUrl(s3Key)
                    : null;
            }
        }
    }

    return kycRequests;
};

/**
 * Service to fetch KYC documents for a given user ID
 */
exports.getKycDocumentsByUserId = async (userId) => {
    try {
        const kycRequest = await KycRequest.findOne({userId:userId})
            .select('uploadedDocuments status dateRequested') 
            .populate('userId', 'name email')
            .lean();

        if (!kycRequest) {
            return null;
        }
        return kycRequest.uploadedDocuments;
    } catch (error) {
        console.error('Error fetching KYC documents from DB:', error);
        throw error;
    }
};

/**
 * Fetch the KYC status for a given user ID.
 * @param {string} userId - The ID of the user whose KYC status is to be fetched.
 * @returns {Object|null} - Returns the KYC request object if found, otherwise null.
 * @throws {Error} - Throws an error if there is an issue during the database operation.
 */
exports.getKycStatusByUserID = async (userId) => {
    try {
        return await KycRequest.findOne({ userId });
    } catch (error) {
        throw new Error('Error while fetching KYC status');
    }
}

/**
 * Updates the KYC status.
 * @param {string} kycId - The ID of the KYC request.
 * @param {string} status - The new status to update ("approved" or "rejected").
 * @returns {Promise<Object>} - Updated KYC request.
 */
exports.updateKycStatus = async (kycRequestId, status) => {
    return await KycRequest.findByIdAndUpdate(
        kycRequestId,
        { status },
        { new: true }
    );
};
