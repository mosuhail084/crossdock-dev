const Joi = require('joi');

exports.addLocationSchema = Joi.object({
    cityName: Joi.string().required().messages({
        'string.empty': 'City name is required',
        'any.required': 'City name is required',
    }),
});
