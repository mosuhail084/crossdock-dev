const Joi = require('joi');
const { VEHICLE_TYPES, VEHICLE_STATUSES } = require('../config/constants');

exports.addVehicleSchema = Joi.object({
    body: Joi.object({
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
        rentalValue: Joi.number().positive().optional().messages({
            'number.base': 'Rental value must be a positive number',
        }),
        locationId: Joi.string().required().messages({
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
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

exports.createRentRequestSchema = Joi.object({
    body: Joi.object({
        vehicleType: Joi.string()
            .valid(...Object.values(VEHICLE_TYPES))
            .required(),
        dateRange: Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().greater(Joi.ref('startDate')).required(),
        }).required(),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

exports.allocateVehicleSchema = Joi.object({
    body: Joi.object({
        vehicleId: Joi.string().required().messages({
            'string.empty': 'Vehicle ID is required',
        }),
        rentRequestId: Joi.string().required().messages({
            'string.empty': 'Driver ID is required',
        }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

exports.disableVehicleSchema = Joi.object({
    body: Joi.object({
        rentRequestId: Joi.string().required().messages({
            'string.empty': 'Driver ID is required',
        }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

exports.fetchInactiveVehiclesSchema = Joi.object({
    query: Joi.object({
        vehicleType: Joi.string().valid('2-wheeler', '3-wheeler (5.8)', '3-wheeler (10)', '4-wheeler')
            .optional()
            .description('Filter vehicles by type.'),
        vehicleNumber: Joi.string()
            .optional()
            .description('Search for vehicles by vehicle number (case-insensitive).'),
        locationId: Joi.string()
            .optional()
            .description('Filter vehicles by location ID.'),
        page: Joi.number().integer().min(1).default(1)
            .description('Page number for pagination. Default is 1.'),
        limit: Joi.number().integer().min(1).max(100).default(10)
            .description('Number of vehicles per page. Default is 10.'),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});

exports.fetchVehicleRequestsSchema = Joi.object({
    query: Joi.object({
        status: Joi.string().valid('pending', 'approved', 'rejected')
            .optional()
            .description('Filter vehicle requests by status. Default is "pending".'),
        vehicleType: Joi.string().valid('2-wheeler', '3-wheeler (5.8)', '3-wheeler (10)', '4-wheeler')
            .optional()
            .description('Filter vehicle requests by vehicle type.'),
        locationId: Joi.string()
            .optional()
            .description('Filter vehicles by location ID.'),
        requestType: Joi.string().valid('primary', 'spare')
            .optional()
            .description('Filter vehicle requests by request type. Default is both "primary and spare".'),
        search: Joi.string()
            .optional()
            .description('Search vehicle requests by vehicle number or driver name or contact number.'),
        page: Joi.number().integer().min(1).default(1)
            .description('Page number for pagination. Default is 1.'),
        limit: Joi.number().integer().min(1).max(100).default(10)
            .description('Number of vehicle requests per page. Default is 10.'),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});

exports.fetchVehicleswithuserSchema = Joi.object({
    query: Joi.object({
        status: Joi.string().valid('active', 'inactive')
            .optional()
            .description('Filter vehicle requests by status. Default is "pending".'),
        vehicleType: Joi.string().valid('2-wheeler', '3-wheeler (5.8)', '3-wheeler (10)', '4-wheeler')
            .optional()
            .description('Filter vehicle requests by vehicle type.'),
        locationId: Joi.string()
            .optional()
            .description('Filter vehicles by location ID.'),
        search: Joi.string()
            .optional()
            .description('Search vehicles by vehicle number or driver name or contact number.'),
        page: Joi.number().integer().min(1).default(1)
            .description('Page number for pagination. Default is 1.'),
        limit: Joi.number().integer().min(1).max(100).default(10)
            .description('Number of vehicle requests per page. Default is 10.'),
    }).required(),
    files: Joi.any().optional(),
    body: Joi.any().optional()
});