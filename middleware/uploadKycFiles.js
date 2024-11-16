const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3Client } = require('../utils/s3.js');
const { errorResponse } = require('../utils/responseUtils');

/**
 * Combined validation and upload middleware for KYC files.
 * Saves the S3 file links in req.body.
 */
const uploadAndValidateKycFiles = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const { phone } = req.body;
            if (!phone) {
                return cb(new Error('Phone number is required in the request body'));
            }

            const uniqueKey = `${phone}/${file.fieldname}`;
            cb(null, uniqueKey);
        },
    }),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
}).fields([
    { name: 'userPhoto', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'driversLicense', maxCount: 1 },
]);

const validateKycFiles = (req, res, next) => {
    uploadAndValidateKycFiles(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer-specific errors
            return res.status(400).json(
                errorResponse(`File upload error: ${err.message}`)
            );
        } else if (err) {
            // Other errors
            return res.status(400).json(
                errorResponse(`Validation error: ${err.message}`)
            );
        }

        // Validate presence of required files
        const requiredFiles = ['userPhoto', 'aadharCard', 'panCard', 'driversLicense'];
        const missingFiles = requiredFiles.filter(
            (field) => !req.files || !req.files[field]
        );

        if (missingFiles.length > 0) {
            return res.status(400).json(
                errorResponse(`Missing required files: ${missingFiles.join(', ')}`)
            );
        }
        req.body.files = {};
        requiredFiles.forEach((field) => {
            req.body.files[field] = req.files[field][0].key;
        });

        next();
    });
};

module.exports = {
    validateKycFiles,
};