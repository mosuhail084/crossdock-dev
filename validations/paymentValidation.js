const Joi = require('joi');

exports.getAllPaymentsSchema = Joi.object({
    query: Joi.object({
        locationId: Joi.string()
            .optional()
            .messages({
                'string.empty': 'Location ID cannot be empty if provided',
            }),
        startDate: Joi.string()
            .optional()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .messages({
                'string.empty': 'Start date cannot be empty if provided',
                'string.pattern.base': 'Start date must be in the format YYYY-MM-DD',
            }),
        endDate: Joi.string()
            .optional()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .messages({
                'string.empty': 'End date cannot be empty if provided',
                'string.pattern.base': 'End date must be in the format YYYY-MM-DD',
            }),
        search: Joi.string()
            .optional()
            .description('Search payments by driver name.'),
        page: Joi.number()
            .optional()
            .min(1)
            .default(1)
            .messages({
                'number.base': 'Page must be a number',
                'number.min': 'Page must be greater than or equal to 1',
            }),
        limit: Joi.number()
            .optional()
            .min(1)
            .default(10)
            .messages({
                'number.base': 'Limit must be a number',
                'number.min': 'Limit must be greater than or equal to 1',
            }),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});
