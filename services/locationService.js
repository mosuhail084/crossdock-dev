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
        const formattedCityName = capitalizeWords(cityName);

        const existingLocation = await Location.findOne({ cityName: formattedCityName });
        if (existingLocation) {
            const error = new Error('Location already exists');
            error.statusCode = 400;
            error.details = { cityName: formattedCityName };
            throw error;
        }

        const newLocation = new Location({ cityName: formattedCityName });
        return await newLocation.save();
    } catch (error) {
        throw error;
    }
};

/**
 * Fetch all locations from the database.
 * @returns {Array} - Array of location objects.
 * @throws {Error} - Throws an error if there is an issue during the database operation.
 */
exports.getAllLocations = async () => {
    try {
        return await Location.find({});
    } catch (error) {
        throw new Error('Error while fetching locations');
    }
};