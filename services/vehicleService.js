const Vehicle = require('../models/vehicleModel');

/**
 * Add a new vehicle.
 * @param {Object} vehicleData - The vehicle details to be added.
 * @returns {Promise<Object>} - The newly created vehicle object.
 * @throws {Error} - If a vehicle with the same number already exists.
 */
exports.addVehicleService = async (vehicleData) => {
    const { vehicleNumber } = vehicleData;

    try {
        const existingVehicle = await Vehicle.findOne({ vehicleNumber });
        if (existingVehicle) {
            const error = new Error('Vehicle with this number already exists');
            error.statusCode = 400;
            error.details = { vehicleNumber };
            throw error;
        }

        const newVehicle = new Vehicle(vehicleData);
        return await newVehicle.save();
    } catch (error) {
        throw error;
    }
};
