const { query } = require('express');
const Joi = require('joi');

// Schema for adding a driver
exports.addDriverSchema = Joi.object({
    body: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.base': 'Name must be a string',
                'string.empty': 'Name cannot be empty',
                'string.min': 'Name must be at least 2 characters long',
                'string.max': 'Name cannot exceed 100 characters',
                'any.required': 'Name is required',
            }),
        phone: Joi.string()
            .custom((value, helper) => {
                // Convert phone string to a number
                const phoneNumber = parseInt(value, 10);
                if (isNaN(phoneNumber)) {
                    return helper.message('Phone must be a valid number');
                }
                return phoneNumber;  // Return the converted number
            })
            .required()
            .messages({
                'string.empty': 'Phone cannot be empty',
                'any.required': 'Phone is required',
            }),
        locationId: Joi.string().required().messages({
            'string.empty': 'Location ID is required',
            'any.required': 'Location ID is required',
        }),
        vehicleId: Joi.string().optional(),
    }).required(),
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

// Schema for adding an admin
exports.addAdminSchema = Joi.object({
    body: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.base': 'Name must be a string',
                'string.empty': 'Name is required',
                'string.min': 'Name must be at least 2 characters',
                'string.max': 'Name cannot exceed 100 characters',
                'any.required': 'Name is required',
            }),
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.base': 'Email must be a string',
                'string.email': 'Email must be a valid email address',
                'string.empty': 'Email is required',
                'any.required': 'Email is required',
            }),
        phone: Joi.number()
            .integer()
            .min(910000000000)
            .max(919999999999)
            .required()
            .messages({
                'number.base': 'Phone must be a number',
                'number.integer': 'Phone must be an integer',
                'number.min': 'Phone number must start with 91 and be 12 digits long',
                'number.max': 'Phone number must start with 91 and be 12 digits long',
                'any.required': 'Phone is required',
            }),
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.base': 'Password must be a string',
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 6 characters',
                'any.required': 'Password is required',
            }),
        locationId: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid Location ID format',
                'string.empty': 'Location ID is required',
                'any.required': 'Location ID is required',
            }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});


exports.updatePasswordSchema = Joi.object({
    body: Joi.object({
        oldPassword: Joi.string().min(6).required().messages({
            'string.base': 'Old password must be a string',
            'string.empty': 'Old password is required',
            'string.min': 'Old password must be at least 6 characters',
            'any.required': 'Old password is required',
        }),
        password: Joi.string().min(6).required().messages({
            'string.base': 'Confirm password must be a string',
            'string.empty': 'Confirm password is required',
            'string.min': 'Confirm password must be at least 6 characters',
            'any.required': 'Confirm password is required',
        })
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

/**
 * Validation schema for retrieving dashboard data
 */
exports.dashboardSchema = Joi.object({
    query: Joi.object({
        locationId: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid Location ID format',
            })
            .description('Filter dashboard data by location ID'),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});


exports.getAllDriversSchema = Joi.object({
    query: Joi.object({
        status: Joi.string().valid('true', 'false')
            .optional()
            .description('Filter drivers by their active status. "true" for active, "false" for inactive.'),
        search: Joi.string()
            .optional()
            .description('Search vehicles by driver name or contact number.'),
        locationId: Joi.string()
            .optional()
            .description('Filter drivers by location ID.'),
        page: Joi.number().integer().min(1).default(1)
            .description('Page number for pagination. Default is 1.'),
        limit: Joi.number().integer().min(1).max(100).default(10)
            .description('Number of drivers per page. Default is 10.'),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});


exports.switchUserStatusSchema = Joi.object({
    body: Joi.object({
        status: Joi.boolean().required().messages({
            'boolean.base': 'Status must be a boolean value',
            'any.required': 'Status is required',
        }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional(),
});

exports.validateDriverIdParam = Joi.object({
    query: Joi.object({
        locationId: Joi.string()
            .optional()
            .description('Filter drivers by location ID.'),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});

exports.updateDriverSchema = Joi.object({
    body: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .optional(),
        phone: Joi.string()
            .custom((value, helper) => {
                // Convert phone string to a number
                const phoneNumber = parseInt(value, 10);
                if (isNaN(phoneNumber)) {
                    return helper.message('Phone must be a valid number');
                }
                return phoneNumber;  // Return the converted number
            })
            .optional(),
    }).optional(),
    files: Joi.any().custom((value, helpers) => {

        return value;
    }).optional(),
    query: Joi.any().optional()
});

