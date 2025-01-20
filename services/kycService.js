const { default: mongoose } = require('mongoose');
const { KYC_STATUS } = require('../config/constants.js');
const { generateSignedUrl } = require('../helpers/s3Helper.js');
const KycRequest = require('../models/kycRequestModel.js');
const Location = require('../models/locationModel.js');
const { ROLES } = require('../config/constants');

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
 * Retrieves a paginated list of KYC requests with optional filters and sorting.
 * @param {Object} queryParams - Query parameters containing optional filters and pagination options.
 * @param {ObjectId} userLocation - The location ID associated with the user making the request (defaults to Bangalore if not provided).
 * @returns {Promise<Object>} - A JSON response containing the list of KYC requests, pagination metadata, and success message.
 * @throws {Error} - Throws an error if the operation fails or the location is not found.
 */
exports.fetchAllKycRequests = async (queryParams, userLocation) => {
    const { status, locationId, page = 1, limit = 10, search } = queryParams;

    if (!userLocation) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        userLocation = bangaloreLocation._id;
    }

    const pipeline = [
        {
            $match: {
                locationId: locationId
                    ? new mongoose.Types.ObjectId(locationId)
                    : userLocation,
                status: status || KYC_STATUS.PENDING,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true,
            },
        },
        ...(search
            ? [
                {
                    $match: {
                        $or: [
                            { 'user.name': { $regex: search, $options: 'i' } },
                            { 'user.phone': { $regex: search, $options: 'i' } },
                        ],
                    },
                },
            ]
            : []),
        {
            $sort: { createdAt: -1 },
        },
        {
            $facet: {
                metadata: [
                    { $count: 'total' },
                ],
                data: [
                    { $skip: (page - 1) * limit },
                    { $limit: parseInt(limit, 10) },
                ],
            },
        },
    ];

    const result = await KycRequest.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total || 0;
    const kycRequests = result[0]?.data || [];

    for (const kycRequest of kycRequests) {
        if (kycRequest.uploadedDocuments) {
            for (const [key, s3Key] of Object.entries(kycRequest.uploadedDocuments)) {
                kycRequest.uploadedDocuments[key] = s3Key
                    ? await generateSignedUrl(s3Key)
                    : null;
            }
        }
    }

    return { total, kycRequests, page, limit };
};

/**
 * Retrieves all KYC requests for a specific user location.
 * @param {string} userLocation - The ID of the user's location. If not provided, defaults to "Bangalore".
 * @returns {Promise<Object>} - An object containing a list of KYC requests with document URLs.
 * @throws {Error} - Throws an error if the location is not found or the query operation fails.
 */
exports.exportAllKYCRequestsService = async (userLocationId, locationId) => {
    const query = {};
    if (!locationId && !userLocationId) {
        const bangaloreLocation = await Location.findOne({ cityName: 'Bangalore' });
        if (!bangaloreLocation) {
            throw new Error('Bangalore location not found.');
        }
        query.locationId = bangaloreLocation._id;
    }
    else {
        query.locationId = locationId || userLocationId;
    }

    const kycRequests = await KycRequest.find(query )
        .populate('userId', 'name phone')
        .sort({ createdAt: -1 });

    const formattedKycRequests = await Promise.all(kycRequests.map(async kycRequest => {
        const documents = {
            "PAN": kycRequest?.uploadedDocuments.panCard,
            "Aadhar": kycRequest?.uploadedDocuments?.aadharCard,
            "Driver's license": kycRequest?.uploadedDocuments?.driversLicense,
            "Driver's picture": kycRequest?.uploadedDocuments?.userPhoto,
        };

        for (const [key, s3Key] of Object.entries(documents)) {
            documents[key] = s3Key ? await generateSignedUrl(s3Key) : null;
        }

        return {
            "Name of driver": kycRequest?.userId?.name,
            "Contact no.": kycRequest?.userId?.phone,
            ...documents
        };
    }));
    return { kycRequests: formattedKycRequests };
};

/**
 * Service to fetch KYC documents for a given user ID
 */
exports.getKycDocumentsByUserId = async (userId) => {
    try {
        const kycRequest = await KycRequest.findOne({ userId: userId })
            .select('uploadedDocuments status dateRequested')
            .populate('userId', 'name email')
            .lean();

        if (!kycRequest) {
            return null;
        }
        if (kycRequest.uploadedDocuments) {
            for (const [key, s3Key] of Object.entries(kycRequest.uploadedDocuments)) {
                kycRequest.uploadedDocuments[key] = s3Key
                    ? await generateSignedUrl(s3Key)
                    : null;
            }
        }
        return kycRequest;
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
