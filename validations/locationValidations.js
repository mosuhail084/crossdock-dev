const Joi = require('joi');

exports.addLocationSchema = Joi.object({
    body: Joi.object({
        cityName: Joi.string()
            .required()
            .messages({
                'string.empty': 'City name is required',
                'any.required': 'City name is required',
            }),
    }).required(),
    query: Joi.any().optional(),
    files: Joi.any().optional()
});