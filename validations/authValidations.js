const Joi = require('joi');

/**
 * Schema for driver login validation
 */
const loginDriverSchema = Joi.object({
    body: Joi.object({
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
        otp: Joi.number()
            .integer()
            .min(100000)
            .max(999999)
            .required()
            .messages({
                'number.base': 'OTP must be a number',
                'number.integer': 'OTP must be an integer',
                'number.min': 'OTP must be exactly 6 digits',
                'number.max': 'OTP must be exactly 6 digits',
                'any.required': 'OTP is required',
            }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

/**
 * Schema for requesting OTP
 */
const requestOtpSchema = Joi.object({
    body: Joi.object({
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
            })
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

/**
 * Schema for driver signup validation
 */
const signupDriverSchema = Joi.object({
    body: Joi.object({
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
        otp: Joi.number()
            .integer()
            .min(100000)
            .max(999999)
            .required()
            .messages({
                'number.base': 'OTP must be a number',
                'number.integer': 'OTP must be an integer',
                'number.min': 'OTP must be exactly 6 digits',
                'number.max': 'OTP must be exactly 6 digits',
                'any.required': 'OTP is required',
            }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

/**
 * Schema for admin login validation
 */
const loginAdminSchema = Joi.object({
    body: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.base': 'Email must be a string',
                'string.email': 'Email must be a valid email address',
                'any.required': 'Email is required',
            }),
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.base': 'Password must be a string',
                'string.min': 'Password must be at least 6 characters long',
                'any.required': 'Password is required',
            }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

/**
 * Schema for update admin password validation
 */
const updatePasswordSchema = Joi.object({
    body: Joi.object({
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
            .min(8)
            .required()
            .messages({
                'string.base': 'New password must be a string',
                'string.min': 'New password must be at least 8 characters long',
                'any.required': 'New password is required',
            }),
            otp: Joi.number()
            .integer()
            .min(100000)
            .max(999999)
            .required()
            .messages({
                'number.base': 'OTP must be a number',
                'number.integer': 'OTP must be an integer',
                'number.min': 'OTP must be exactly 6 digits',
                'number.max': 'OTP must be exactly 6 digits',
                'any.required': 'OTP is required',
            }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

/**
 * Schema for verify admin otp validation
 */
const verifyOtpSchema = Joi.object({
    body: Joi.object({
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
            otp: Joi.number()
            .integer()
            .min(100000)
            .max(999999)
            .required()
            .messages({
                'number.base': 'OTP must be a number',
                'number.integer': 'OTP must be an integer',
                'number.min': 'OTP must be exactly 6 digits',
                'number.max': 'OTP must be exactly 6 digits',
                'any.required': 'OTP is required',
            }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});

module.exports = {
    loginDriverSchema,
    signupDriverSchema,
    requestOtpSchema,
    loginAdminSchema,
    updatePasswordSchema,
    verifyOtpSchema
};