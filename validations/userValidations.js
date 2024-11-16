const Joi = require('joi');

exports.addDriverSchema = Joi.object({
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
    locationId: Joi.string().required(),
    vehicleId: Joi.string().optional(),
}).unknown();