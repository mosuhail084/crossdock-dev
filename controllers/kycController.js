const { KYC_STATUS } = require('../config/constants');
const { uploadToS3, clearS3Directory } = require('../helpers/s3Helper');
const { createKycRequest, updateKycStatus, getKycStatusByUserID, fetchAllKycRequests, getKycDocumentsByUserId, exportAllKYCRequestsService } = require('../services/kycService');
const { updateUserLocation } = require('../services/userService');
const { generateJwtToken } = require('../utils/jwtUtils');
const { successResponse, errorResponse } = require('../utils/responseUtils');


/**
 * Submits a new KYC request for a user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - Created KYC request.
 */
exports.submitKycRequest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userPhone = req.user.phone;
        const locationId = req.body.locationId;
        const uploadedFiles = {};

        await clearS3Directory(userId);

        for (let file of req.files) {
            const uploadResult = await uploadToS3(file, userId);
            uploadedFiles[file.fieldname] = uploadResult;
        }
        const kycRequest = await createKycRequest({
            userId,
            locationId,
            uploadedDocuments: uploadedFiles,
            status: KYC_STATUS.PENDING,
        });

        const kycRequestWithToken = {
            ...kycRequest.toObject(),
            token: await generateJwtToken({
                _id: req.user.userId,
                phone: req.user.phone,
                role: req.user.role,
                name: req.user.name,
                locationId,
            }),
        };

        return res.status(201).json(successResponse(kycRequestWithToken, 'KYC request submitted successfully.'));
    } catch (error) {
        console.error('Error submitting KYC request:', error);
        return res.status(500).json(errorResponse('Failed to submit KYC request.', error.message));
    }
};


/**
 * Retrieves all KYC requests with optional filters and pagination.
 * @param {Object} req - Express request object containing query parameters for filtering, sorting, and pagination.
 * @param {Object} res - Express response object used to send the list of KYC requests or an error message.
 * @returns {Promise<Object>} - Returns a JSON response with the list of KYC requests or an error.
 */
exports.getAllKycRequests = async (req, res) => {
    try {
        const { kycRequests, total, page, limit } = await fetchAllKycRequests(req.query, req.user.locationId);
        return res.status(200).json(successResponse({ kycRequests, total, page, limit }, 'KYC requests retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Failed to fetch kyc requests.'));
    }
};

/**
 * Controller to export all KYC requests.
 * @param {Object} req - The request object, containing the user's location ID.
 * @param {Object} res - The response object used to send the response.
 * @returns {Promise<Object>} - Responds with a JSON object containing KYC requests or an error message.
 * @throws {Error} - Returns an error response if the service call fails.
 */
exports.exportAllKYCRequests = async (req, res) => {
    try {
        const result = await exportAllKYCRequestsService(req.user.locationId, req.query.locationId);
        return res.status(200).json(successResponse(result, 'KYC requests retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Failed to fetch kyc requests.'));
    }
};

/**
 * Retrieves the KYC documents for a specified user.
 * 
 * @param {Object} req - The request object, which contains the userId parameter in the URL.
 * @param {Object} res - The response object used to send back the KYC documents or error messages.
 * 
 * @returns {Promise<Object>} - A JSON response containing either the user's KYC documents or an error message.
 * 
 * @throws {Error} - Throws an error if the KYC documents cannot be fetched due to invalid userId or internal server issues.
 */
exports.getUserKycDocuments = async (req, res) => {
    try {
        const { userId } = req.params;
        const kycDocuments = await getKycDocumentsByUserId(userId);
        return res.status(200).json(successResponse({ kycDocuments }, 'KYC documents retrieved successfully.'));
    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Failed to fetch kyc documents.'));
    }
};

/**
 * Retrieves the current status of a user's KYC request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object used to send the status of the user's KYC request or an error message.
 * @returns {Promise<Object>} - Returns a JSON response with the status of the user's KYC request or an error.
 */
exports.checkKycStatus = async (req, res) => {
    try {
        console.log(req.user);
        const userId = req.user.userId;

        const kycRequest = await getKycStatusByUserID(userId);

        return res.status(200).json(successResponse({
            userId,
            status: kycRequest ? kycRequest.status : 'not found',
        }, 'KYC status retrieved successfully.'));

    } catch (error) {
        return res.status(error.status || 500).json(errorResponse(error.message || 'Failed to check status.'));
    }
};


/**
 * Approves or rejects a KYC request.
 * If approved, updates the user's location ID from the KYC request.
 * @param {Object} req - Express request object containing the ID of the KYC request and the new status.
 * @param {Object} res - Express response object used to send the status of the KYC request or an error message.
 * @returns {Promise<Object>} - Returns a JSON response with the status of the KYC request or an error.
 */
exports.approveOrRejectKyc = async (req, res) => {
    try {
        const { kycId, status } = req.body;

        const updatedKyc = await updateKycStatus(kycId, status);

        if (!updatedKyc) {
            return res.status(404).json(errorResponse('KYC request not found.'));
        }
        if (status === KYC_STATUS.APPROVED) {
            const userId = updatedKyc.userId;
            const locationId = updatedKyc.locationId;

            if (!locationId) {
                return res.status(400).json(errorResponse('Location ID is missing in the KYC request.'));
            }

            await updateUserLocation(userId, locationId);
        }

        return res
            .status(200)
            .json(successResponse(updatedKyc, 'KYC status updated successfully.'));
    } catch (error) {
        return res
            .status(error.status || 500)
            .json(errorResponse(error.message || 'Failed to update KYC status.'));
    }
};
