const Joi = require('joi');
const { KYC_STATUS } = require('../config/constants');

/**
 * Validation schema for changing the KYC status.
 */
const changeKycStatusSchema = Joi.object({
    body: Joi.object({
        kycId: Joi.string()
            .required()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .messages({
                'string.pattern.base': 'Invalid kycId format. Must be a valid MongoDB ObjectId.',
                'any.required': 'The kycId is required.',
            })
            .description('The ID of the KYC request to update.'),
        status: Joi.string()
            .required()
            .valid(KYC_STATUS.APPROVED, KYC_STATUS.REJECTED)
            .messages({
                'any.only': `Status must be one of: ${Object.values(KYC_STATUS).join(', ')}.`,
                'any.required': 'The status is required.',
            })
            .description('The new status for the KYC request. Allowed values: "approved" or "rejected".'),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

/**
 * Validation schema for retrieving all KYC requests
 */
const getAllKycRequestsSchema = Joi.object({
    query: Joi.object({
        status: Joi.string()
            .valid('pending', 'approved', 'rejected')
            .optional()
            .messages({
                'any.only': 'Status must be one of: "pending", "approved", or "rejected".',
            })
            .description('Filter KYC requests by status (pending, approved, or rejected).'),
        locationId: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional()
            .messages({
            'string.pattern.base': 'Invalid Location ID format',
            })
            .description('Filter KYC requests by location ID'),
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .messages({
                'number.base': 'Page must be a number.',
                'number.integer': 'Page must be an integer.',
                'number.min': 'Page must be at least 1.',
            })
            .description('Page number for pagination. Default is 1.'),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages({
                'number.base': 'Limit must be a number.',
                'number.integer': 'Limit must be an integer.',
                'number.min': 'Limit must be at least 1.',
                'number.max': 'Limit cannot exceed 100.',
            })
            .description('Number of KYC requests per page. Default is 10. Max is 100.'),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});

/**
 * KYC Schema for validating phone and required files.
 */
const kycSchema = Joi.object({
    body: Joi.object({
        locationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
            'string.pattern.base': 'Invalid Location ID format',
            'string.empty': 'Location ID is required',
            'any.required': 'Location ID is required',
        }),
    }),
    files: Joi.any().custom((value, helpers) => {
        const requiredFiles = ['userPhoto', 'aadharCard', 'panCard', 'driversLicense'];

        const missingFiles = requiredFiles.filter(
            (fileField) => !value || !value.some((file) => file.fieldname === fileField)
        );

        if (missingFiles.length > 0) {
            return helpers.error('any.custom', { message: `Missing required files: ${missingFiles.join(', ')}` });
        }

        return value;
    }),
    query: Joi.any().optional()
});


module.exports = { kycSchema, changeKycStatusSchema, getAllKycRequestsSchema };