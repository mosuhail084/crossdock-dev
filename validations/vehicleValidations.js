const Joi = require('joi');
const { VEHICLE_TYPES, VEHICLE_STATUSES } = require('../config/constants');

exports.addVehicleSchema = Joi.object({
    vehicleType: Joi.string()
        .valid(...Object.values(VEHICLE_TYPES))
        .required()
        .messages({
            'string.empty': 'Vehicle type is required',
            'any.only': `Vehicle type must be one of the following: ${Object.values(VEHICLE_TYPES).join(', ')}`,
        }),
    vehicleNumber: Joi.string().required().messages({
        'string.empty': 'Vehicle number is required',
    }),
    rentalValue: Joi.number().positive().required().messages({
        'number.base': 'Rental value must be a positive number',
    }),
    locationID: Joi.string().required().messages({
        'string.empty': 'Location ID is required',
    }),
    status: Joi.string()
        .valid(...Object.values(VEHICLE_STATUSES))
        .optional()
        .default(VEHICLE_STATUSES.INACTIVE)
        .messages({
            'string.empty': 'Status is required',
            'any.only': `Status must be one of the following: ${Object.values(VEHICLE_STATUSES).join(', ')}`,
        }),
});
