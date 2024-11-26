const express =require('express');
const { loginController, createVehicle, changePassword, dashboard, usersPayments, getKycDocuments, kycApproval,  vehicleAllocation, vehicleDeallocation, spareAllocation, getRentalRequests, getSpareRequests, deleteUser, userEdit, userInfo, getKycRequests, inactiveVehicles, disableUser, enableUser, addUser, disableVehicle, enableVehicle, getAdminStats, forgotPassword, usersPaymentHistory, getActiveVehicleByType } = require('../controllers/adminController.js');
const { uploadFields } = require('../middleware/multer');
const { searchVehicles, searchRentRequests, searchSpareRequests, searchKYCRequests, filterVehicles, filterRent, filterSpare, filterKYC, searchUsers, filterUsers, filterPaymentsbySpare, searchPayments, filterPaymentsbyDate } = require('../controllers/searchFunctions.js');
const {  downloadVehicles, downloadRent, downloadSpare, downloadKYC, downloadUsers, downloadPayments } = require('../controllers/downloadFunctions.js');
const router=express.Router();

router.post('/login', loginController);
router.post("/forgot-password",forgotPassword)
router.post("/change-password",changePassword)
router.get('/payments', usersPayments);
router.get('/kycdocs/:phone', getKycDocuments);
router.post('/kyc-approval', kycApproval);
router.get('/rent-requests', getRentalRequests);
router.get('/spare-requests', getSpareRequests);
router.get('/kyc-requests', getKycRequests);
router.post('/vehicle-allocate', vehicleAllocation);
router.post('/vehicle-deallocate', vehicleDeallocation);
router.post('/spare-allocate', spareAllocation);
router.delete('/user-delete', deleteUser);
router.post('/user-edit', uploadFields, userEdit);
router.get('/user-info/:phone', userInfo);
router.get('/inactive-vehicles', inactiveVehicles);
router.get('/active-vehicles-by-type', getActiveVehicleByType);
router.post('/user-disable', disableUser);
router.post('/user-enable', enableUser);
router.post('/add-user', uploadFields,addUser);
router.post('/createVehicle', createVehicle);
router.post('/disable-vehicle', disableVehicle);
router.post('/enable-vehicle', enableVehicle);
router.get('/dashboard/:token',dashboard)
router.get('/stats/:token', getAdminStats);
router.get('/search/vehicles', searchVehicles);
router.get('/search/rent', searchRentRequests);
router.get('/search/spare', searchSpareRequests);
router.get('/search/kyc', searchKYCRequests);
router.post('/filter/vehicles', filterVehicles);
router.post('/filter/rent', filterRent);
router.post('/filter/spare', filterSpare);
router.post('/filter/kyc', filterKYC);
router.post('/download/dashboard', downloadVehicles);
router.post('/download/rental-requests', downloadRent);
router.post('/download/spare', downloadSpare);
router.post('/download/kyc', downloadKYC);
router.post('/download/users', downloadUsers);
router.get('/search/users', searchUsers);
router.get('/filter/users', filterUsers)
router.get('/filter/payments/bySpare', filterPaymentsbySpare);
router.post('/filter/payments/byDate', filterPaymentsbyDate)
router.get('/search/payments', searchPayments)
router.post('/download/payments', downloadPayments)
router.get('/usersPayment/:token', usersPaymentHistory)

module.exports=router;