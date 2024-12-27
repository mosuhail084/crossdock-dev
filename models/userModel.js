const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

/**
 * User Schema
 */
const userSchema = new Schema({
    name: { type: String, required: false },
    email: { type: String, sparse: true },
    phone: { type: String, sparse: true },
    password: { type: String },
    role: { type: String, enum: Object.values(ROLES), required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    otp: { type: Number },
    otpExpiry: { type: Date },
    isActive: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $exists: true, $ne: null } } });

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null } } });

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