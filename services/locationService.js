// services/locationService.js
const { capitalizeWords } = require('../helpers/helper');
const Location = require('../models/locationModel');

/**
 * Add a new location to the database.
 * @param {string} cityName - The name of the city to be added.
 * @returns {Promise<Object>} - The newly created location object.
 * @throws {Error} - If the location already exists or if a database error occurs.
 */
exports.addLocationService = async (cityName) => {
    try {
        // Capitalize each word in the city name
        const formattedCityName = capitalizeWords(cityName);

        // Check if the location already exists
        const existingLocation = await Location.findOne({ cityName: formattedCityName });
        if (existingLocation) {
            const error = new Error('Location already exists');
            error.statusCode = 400;
            error.details = { cityName: formattedCityName };
            throw error;
        }

        // Create and save the new location
        const newLocation = new Location({ cityName: formattedCityName });
        return await newLocation.save();
    } catch (error) {
        throw error;
    }
};