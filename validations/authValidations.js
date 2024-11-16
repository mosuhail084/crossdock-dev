const Joi = require('joi');

const loginDriverSchema = Joi.object({
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
});

const requestOtpSchema = Joi.object({
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
});

const signupDriverSchema = Joi.object({
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
});

const loginAdminSchema = Joi.object({
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
});

module.exports = {
    loginDriverSchema,
    signupDriverSchema,
    requestOtpSchema,
    loginAdminSchema
};