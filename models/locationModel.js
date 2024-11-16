const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
    {
        cityName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Location', locationSchema);