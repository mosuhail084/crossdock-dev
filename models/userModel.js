const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');
const Schema = mongoose.Schema;

/**
 * User Schema
 */
const userSchema = new Schema({
    name: { type: String, required: false },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String },
    role: { type: String, enum: Object.values(ROLES), required: true },
    locationID: { type: Schema.Types.ObjectId, ref: 'Location' },
    otp: { type: Number },
    otpExpiry: { type: Date },
}, { timestamps: true, versionKey: false});


userSchema.pre('save', function (next) {
    if (this.role === ROLES.DRIVER && !this.phone) {
        return next(new Error('Phone is required for Driver'));
    }
    if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(this.role)) {
        if (!this.email) {
            return next(new Error('Email is required for Admin and SuperAdmin'));
        }
        if (!this.password) {
            return next(new Error('Password is required for Admin and SuperAdmin'));
        }
    }
    next();
});

/**
 * Compares the provided password with the user's stored password.
 * @param {string} candidatePassword - The password to compare.
 * @returns {Promise<boolean>} - A promise that resolves to true if the passwords match, otherwise false.
 * @throws {Error} - Throws an error if there is an issue while comparing passwords.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error while comparing passwords');
    }
};

module.exports = mongoose.model('User', userSchema);