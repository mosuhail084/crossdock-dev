const mongoose = require('mongoose');

const superadminSchema = new mongoose.Schema({
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
    }
});

const superAdminModel = mongoose.model('Superadmin', superadminSchema);
module.exports = superAdminModel;