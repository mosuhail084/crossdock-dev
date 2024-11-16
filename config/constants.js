const ROLES = {
    ADMIN: 'Admin',
    SUPER_ADMIN: 'SuperAdmin',
    DRIVER: 'Driver',
};

const VEHICLE_TYPES = {
    TWO_WHEELER: '2-wheeler',
    THREE_WHEELER_5_8: '3-wheeler (5.8)',
    THREE_WHEELER_10: '3-wheeler (10)',
    FOUR_WHEELER: '4-wheeler',
};

const VEHICLE_STATUSES = {
    UNDER_REPAIR: 'underRepair',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SPARE: 'spare',
};

module.exports = {
    ROLES, 
    VEHICLE_TYPES,
    VEHICLE_STATUSES
};
