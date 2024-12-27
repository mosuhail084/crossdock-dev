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

const VEHICLE_REQUEST_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PROCESSED: 'processed',
};

const KYC_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

const VEHICLE_RENTAL_VALUES = {
    '2-wheeler': 600,
    '3-wheeler (5.8)': 600,
    '3-wheeler (10)': 600,
    '4-wheeler': 600,
};

const VEHICLE_REQUEST_TYPES = {
    PRIMARY: 'primary',
    SPARE: 'spare',
};

module.exports = {
    ROLES,
    VEHICLE_TYPES,
    VEHICLE_STATUSES,
    KYC_STATUS,
    VEHICLE_RENTAL_VALUES,
    VEHICLE_REQUEST_STATUSES,
    VEHICLE_REQUEST_TYPES
};
