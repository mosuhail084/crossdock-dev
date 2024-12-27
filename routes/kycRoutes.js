const express = require('express');
const { submitKycRequest, checkKycStatus, approveOrRejectKyc, getAllKycRequests, getUserKycDocuments } = require('../controllers/kycController');
const { checkPermission } = require('../middleware/checkPermission');
const { changeKycStatusSchema, getAllKycRequestsSchema, kycSchema } = require('../validations/kycValidations');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

/**
 * @swagger
 * /v1/kyc/upload:
 *   post:
 *     summary: Submit KYC request.
 *     description: Allows users to upload KYC documents for approval.
 *     tags:
 *       - KYC
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userPhoto:
 *                 type: string
 *                 format: binary
 *               panCard:
 *                 type: string
 *                 format: binary
 *               aadharCard:
 *                 type: string
 *                 format: binary
 *               driversLicense:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: KYC request submitted successfully.
 */
router.post('/upload', checkPermission('SUBMIT_KYC'), validateRequest(kycSchema), submitKycRequest);

/**
 * @swagger
 * /v1/kyc/get-requests:
 *   get:
 *     summary: Retrieve all KYC requests
 *     description: Fetch a paginated list of KYC requests with optional filters for status.
 *     tags:
 *       - KYC
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter KYC requests by status (pending, approved, or rejected).
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter KYC requests by the associated location ID.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination. Default is 1.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of KYC requests per page. Default is 10. Maximum is 100.
 *     responses:
 *       200:
 *         description: A paginated list of KYC requests.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "KYC requests retrieved successfully."
 *               data:
 *                 total: 25
 *                 page: 1
 *                 limit: 10
 *                 kycs:
 *                   - _id: "64fa3a17dabc1f00012345ef"
 *                     userId: "64fa3a17dabc1f00012345aa"
 *                     status: "pending"
 *                     uploadedDocuments:
 *                       userPhoto: "https://s3.amazonaws.com/uploads/photo.jpg"
 *                       panCard: "https://s3.amazonaws.com/uploads/pancard.jpg"
 *                       aadharCard: "https://s3.amazonaws.com/uploads/aadhar.jpg"
 *                       driversLicense: "https://s3.amazonaws.com/uploads/license.jpg"
 *                     dateRequested: "2023-10-20T14:45:00.000Z"
 *                     createdAt: "2023-10-20T14:45:00.000Z"
 *                     updatedAt: "2023-10-22T09:30:00.000Z"
 *       400:
 *         description: Validation error for query parameters.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Validation error"
 *               details:
 *                 - "status must be one of [pending, approved, rejected]"
 *                 - "page must be greater than or equal to 1"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.get('/get-requests', checkPermission('GET_ALL_KYC_REQUESTS'), validateRequest(getAllKycRequestsSchema), getAllKycRequests);

/**
 * @swagger
 * /v1/kyc/status:
 *   get:
 *     summary: Check the KYC status of a user.
 *     description: Fetch the KYC status of the authenticated user.
 *     tags:
 *       - KYC
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: KYC status retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "KYC status retrieved successfully."
 *               data:
 *                 userId: "64fa3a17dabc1f00012345ef"
 *                 status: "pending"
 *       '404':
 *         description: KYC status not found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "KYC status not found for this user."
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/status', checkPermission('CHECK_KYC'), checkKycStatus);

/**
 * @swagger
 * /v1/kyc/update-status:
 *   post:
 *     summary: Approve or reject a KYC request.
 *     description: Allows an admin or super admin to update the status of a KYC request to "approved" or "rejected".
 *     tags:
 *       - KYC
 *     parameters:
 *       - in: body
 *         name: kycId
 *         required: true
 *         description: The ID of the KYC request.
 *         schema:
 *           type: string
 *       - in: body
 *         name: status
 *         required: true
 *         description: The new status for the KYC request.
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [approved, rejected]
 *               example: approved
 *     responses:
 *       '200':
 *         description: KYC request updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "KYC request approved successfully."
 *               data:
 *                 _id: "64fa3a17dabc1f00012345ef"
 *                 userId: "64fa3a17dabc1f00012345gh"
 *                 status: "approved"
 *       '404':
 *         description: KYC request not found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "KYC request not found."
 *       '400':
 *         description: Invalid status provided.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid KYC status."
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.post('/update-status', checkPermission('MANAGE_KYC'), validateRequest(changeKycStatusSchema), approveOrRejectKyc);

/**
 * @swagger
 * /v1/kyc/kyc-docs/{userId}:
 *   get:
 *     summary: Get KYC documents for a specific user.
 *     description: Allows an admin or super admin to retrieve the KYC documents (e.g., PAN card, Aadhar card, etc.) for a specific user.
 *     tags:
 *       - KYC
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user whose KYC documents are to be fetched.
 *         schema:
 *           type: string
 *           example: "64fa3a17dabc1f00012345gh"
 *     responses:
 *       '200':
 *         description: KYC documents retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "KYC documents retrieved successfully."
 *               data:
 *                 userPhoto: "path/to/photo.jpg"
 *                 panCard: "path/to/pan.jpg"
 *                 aadharCard: "path/to/aadhar.jpg"
 *                 driversLicense: "path/to/license.jpg"
 *       '404':
 *         description: No KYC documents found for the given user.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No KYC documents found for this user."
 *       '400':
 *         description: Invalid userId format.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid userId format. Must be a valid MongoDB ObjectId."
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error."
 */
router.get('/kyc-docs/:userId', checkPermission('GET_KYC_DOCS'), getUserKycDocuments);

module.exports = router;
