const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    phone: {
        type: Number,
        required: true,
    },
    vehicleType: {
        type: String,
    },
    StartDate: {
        type: mongoose.Schema.Types.Mixed,
    },
    EndDate: {
        type: Date,
    },
    rentalValue: {
        type: Number,
    },
    noOfDays: {
        type: Number
    },
    type: {
        type: String
    },
    documents: [{
        documentType: {
            type: String,
            required: true,
            enum: ['UserImage', 'PanCard', 'AadharCard', 'DriversLicense']
        },
        documentPath: {
            type: String,
            required: true
        }
    }],
    name: {
        type: String
    },
    endDateMinus8Hours: {
        type: Date
    },
    primaryVehicle: {
        type: String
    },
    location: {
        type: String
    },
    vehicleNumber: {
        type: String
    }
}, {
    timestamps: true
});

const orderModel = mongoose.model("Order", orderSchema);
module.exports = orderModel;
