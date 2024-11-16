const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone:{
      type:Number,
      unique: true
    },
    password: {
        type: String,
        required: true
    },
    forgotPasswordToken: {
        type: String
    },
    forgotPasswordExpires: {
        type: Date
    },
    role: {
        type: String,
    },
    location: {
        type: String, 
        required: true 
    }
});

const adminModel = mongoose.model('Admin', adminSchema);
module.exports = adminModel;