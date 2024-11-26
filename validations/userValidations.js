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