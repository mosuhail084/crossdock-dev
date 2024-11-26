const PERMISSIONS = require('../config/permissions');
const { errorResponse } = require('../utils/responseUtils');

/**
 * Middleware to check if the user's role has the required permission.
 * @param {string} permission - The permission to validate.
 * @returns {function} - Express middleware function.
 */
const checkPermission = (permission) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (PERMISSIONS[permission]?.includes(userRole)) {
            return next();
        }

        return res.status(403).json(errorResponse('Access denied: Insufficient permissions'));
    };
};

module.exports = { checkPermission };