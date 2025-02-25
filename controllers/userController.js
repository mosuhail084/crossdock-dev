const dotenv = require('dotenv')
dotenv.config()
const { createOrder } = require("../utils/cashfree");
const userModel = require('../models/userModel');
const vehicleModel = require('../models/vehicleModel.js');
const { s3Client } = require('../utils/s3.js');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { convertToISODate, formatTime } = require('../utils/helpers.js');
const orderModel = require('../models/orderModels.js');
const { scheduleVehicleDeactivation, disableTimer } = require('../utils/cronScheduler.js');
const { successResponse, errorResponse } = require('../utils/responseUtils.js');
const { ROLES, KYC_STATUS } = require('../config/constants.js');
const { createUser, createAdmin, updatePasswordforadmin, getDashboardStats, switchUserStatusService, fetchAllDriversService, getPaymentHistoryService, getAllocatedVehiclesService, exportAllDataService, deleteDriverService, exportDriversService, updateDriverService } = require('../services/userService.js');
const { createKycRequest, updateKycDocuments } = require('../services/kycService.js');
const { uploadToS3, clearS3Directory } = require('../helpers/s3Helper.js');




exports.rentVehicles = async (req, res) => {
  const userId = req.decoded.userId;
  const phone = req.decoded.phone;
  if (!userId) {
    return res.status(400).json({ message: 'Please login or signup first!' });
  }

  console.log(phone)

  const { vehicleType, StartDate, EndDate, rentalValue, noOfDays, vehicleNumber } = req.body;

  if (!vehicleType || !StartDate || !EndDate || !rentalValue || !vehicleNumber) {
    return res.status(400).json({ message: 'Please provide proper information!' });
  }

  // Convert the StartDate and EndDate to ISO format in IST
  let allocationDateISO, endDateISO;
  try {
    allocationDateISO = convertToISODate(StartDate);
    endDateISO = convertToISODate(EndDate);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid date format', error: error.message });
  }

  // Compare with the current date in IST
  const now = new Date();
  const ISTOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const nowIST = new Date(now.getTime() + ISTOffset).toISOString().split('T')[0];

  if (allocationDateISO.split('T')[0] < nowIST) {
    return res.status(400).json({ message: 'Start date cannot be in the past!' });
  }

  // Calculate the number of days if noOfDays is not provided
  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const differenceInTime = endDate - startDate;
    return Math.ceil(differenceInTime / (1000 * 3600 * 24)); // convert milliseconds to days
  };

  const days = noOfDays || calculateDays(allocationDateISO, endDateISO);

  // Create another ISO string which is 8 hours before the end time
  const endDate = new Date(endDateISO);
  const endDateMinus8Hours = new Date(endDate.getTime() - 8 * 60 * 60 * 1000);

  // Utility function to format time
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const endDateMinus8HoursISO = formatTime(endDateMinus8Hours); // Format time correctly
  const endDateISOFormatted = formatTime(endDate); // Format time correctly

  try {
    const userExist = await userModel.findById(userId);

    if (!userExist) {
      return res.status(400).json({ message: 'User does not exist!' });
    }

    const findVehicle = await vehicleModel.findOneAndUpdate(
      { vehicleNumber: vehicleNumber, vehicleType: vehicleType },
      {
        status: 'Active',
        driverName: userExist.name,
        driverContactNumber: userExist.phone,
        AllocationDate: allocationDateISO,
        EndDate: endDateISO,
        rentalValue: rentalValue,
        noOfdays: days
      },
      { new: true } // Return the updated document
    );

    if (!findVehicle) {
      return res.status(404).json({ message: 'Vehicle not found!' });
    }

    const user = await userModel.findByIdAndUpdate(userId, {
      '$push': {
        paymentHistory: {
          AllocationDate: allocationDateISO,
          EndDate: endDateISO,
          rentalValue: rentalValue,
          vehicleType: vehicleType,
          vehicleNumber: findVehicle.vehicleNumber,
          noOfDays: days
        }
      },
      primaryVehicle: findVehicle._id,
    });

    if (!user) {
      return res.status(400).json({ message: 'User details not updated properly!' });
    }


    await orderModel.deleteMany({ phone: phone, type: 'Approved Request' });

    return res.status(201).json({
      message: 'Vehicle Rented!',
      endDateStart: endDateMinus8HoursISO,
      endDateEnd: endDateISOFormatted
    });
  } catch (error) {
    console.error("Error in rentVehicles:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.rentRequest = async (req, res) => {
  const userId = req.decoded.userId;
  if (!userId) {
    return res.status(400).json({ message: 'Please login or signup first!' });
  }

  const { vehicleType } = req.body;

  if (!vehicleType) {
    return res.status(400).json({ message: 'Please provide vehicle type!' });
  }

  const now = new Date().toISOString();
  // Note: Assuming convertToISODate function correctly handles the conversion and timezone.
  try {
    const user = await userModel.findByIdAndUpdate(userId, {
      vehicleAllocPending: true,
      vehicleAllocApproved: false,
      vehicleAllocRejected: false
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const newOrder = new orderModel({
      name: user.name,
      phone: req.decoded.phone,
      vehicleType,
      StartDate: now,
      type: 'Rental Request',
      location: user.location || ''
    });

    await newOrder.save();
    // Return the same endDateISO that is set in the database
    return res.status(201).json({ message: 'Vehicle details sent for approval!' });
  } catch (error) {
    console.error("Error in rentVehicles:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.spareVehicle = async (req, res) => {
  const { vehicleType } = req.body;
  const userId = req.decoded.userId;

  if (!vehicleType) {
    return res.status(401).json({ message: 'please provide vehicleType!' })
  }

  try {

    const user = await userModel.findByIdAndUpdate(userId, {
      spareAllocPending: true,
      spareAllocApproved: false,
      spareAllocRejected: false
    })

    if (!user) {
      return res.status(400).json({ message: "No User found" });
    }

    if (!user.primaryVehicle) {
      return res.status(400).json({ message: "You don't have a primary vehicle" });
    }

    const findVehicle = await vehicleModel.findById(user.primaryVehicle);

    if (!findVehicle) {
      return res.status(401).json({ message: 'No Vehicle found!' });
    }

    console.log(findVehicle)
    const spareOrder = new orderModel({
      name: user.name,
      phone: req.decoded.phone,
      vehicleType,
      StartDate: findVehicle.AllocationDate,
      EndDate: findVehicle.EndDate,
      rentalValue: findVehicle.rentalValue,
      noOfDays: user.paymentHistory[user.paymentHistory.length - 1].noOfDays,
      primaryVehicle: user.paymentHistory[user.paymentHistory.length - 1].vehicleNumber,
      type: 'Spare Request',
      location: user.location || ''
    })

    spareOrder.save();

    console.log(spareOrder.EndDate);
    // Create another ISO string which is 8 hours before the end time
    const endDate = new Date(spareOrder.EndDate.toISOString());
    const endDateMinus8Hours = new Date(endDate.getTime() - 8 * 60 * 60 * 1000);

    // Convert to ISO string and add IST offset
    const endDateMinus8HoursISO = endDateMinus8Hours.toISOString().split('.')[0]  // Use UTC offset

    const spareEndDateStart = formatTime(endDateMinus8HoursISO);
    const spareEndDateEnd = formatTime(spareOrder.EndDate.toISOString());

    return res.status(201).json({ message: 'Spare Request Sent!', spareEndDateStart, spareEndDateEnd });
  } catch (error) {
    console.error("Error in spareVehicle:", error);
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};


exports.notifications = async (req, res) => {
  const userId = req.decoded.userId;

  try {
    const now = new Date();
    const user = await userModel.findById(userId);
    let spare = null;

    if (!user.paymentHistory) {
      return res.status(400).json({ message: 'User has no payment history!' });
    }

    if (!user.primaryVehicle) {
      return res.status(400).json({ message: 'User has no vehicles allocated to them at the moment!' });
    }

    const findVehicle = await vehicleModel.findById(user.primaryVehicle);

    if (findVehicle.status === 'Under-Repair' && user.spareVehicle) {
      spare = await vehicleModel.findById(user.spareVehicle);
    }

    if (findVehicle.status === 'Inactive') {
      if (!user.spareVehicle) {
        return res.status(200).json({ message: 'Primary Vehicle is Inactive' });
      } else if (spare && spare.status === 'Inactive') {
        if (spare.action === 'inactive') {
          disableTimer(user);
          return res.status(200).json({ message: 'Spare Vehicle is disabled' });
        }
        return res.status(200).json({ message: 'Spare Vehicle is Inactive' });
      }
    }

    if (findVehicle.action === 'inactive') {
      disableTimer(user);
      return res.status(200).json({ message: 'Primary Vehicle is disabled' });
    }

    const lastPayment = new Date(user.paymentHistory[user.paymentHistory.length - 1].EndDate);

    console.log(`lastPayment: ${lastPayment}`);
    console.log(`now: ${now}`);

    if (lastPayment.toISOString().split('T')[0] === now.toISOString().split('T')[0]) {
      console.log('Today is the last payment day, scheduling deactivation.');
      await scheduleVehicleDeactivation(user, lastPayment);
      await userModel.findByIdAndUpdate(user._id, { cronJobScheduled: true });
      return res.status(200).json({ message: 'Last day' });
    }

    return res.status(200).json({ message: "Your tenure isn't over nor is vehicle disabled" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};



exports.uploadController = async (req, resp) => {
  try {
    const files = req.files;
    const { location } = req.body;
    console.log(location)
    if (!location) {
      return resp.status(400).json({ success: false, message: 'Location needed' });
    }
    // const { location } = req.body;
    const date = new Date().toISOString(); // Convert date to ISO string

    if (!files) {
      return resp.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const user = await userModel.findOneAndUpdate({ _id: req.decoded.userId }, {
      kycPending: true,
      kycApproved: false,
      kycRejected: false
    });

    if (!user) {
      return resp.status(400).json({ success: false, message: 'No user found, please login or signup first!' });
    }

    const documentPromises = Object.keys(files).map(async (key) => {
      const file = files[key][0]; // Since each field has maxCount: 1, take the first file
      const params = {
        Bucket: process.env.BUCKET_NAME, // replace with your bucket name
        Key: `${req.decoded.phone}/${file.fieldname}`, // Use phone number in the Key
        Body: file.buffer,
        ContentType: file.mimetype
      };

      await s3Client.send(new PutObjectCommand(params));

      return {
        documentType: file.fieldname,
        documentPath: `https://${process.env.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${req.decoded.phone}/${file.fieldname}`
      };
    });

    const documents = await Promise.all(documentPromises);

    const request = new orderModel({
      phone: user.phone,
      name: user.name,
      documents: documents,
      type: 'KYC request',
      StartDate: date,
      location: location
    });

    await request.save();

    resp.status(201).json({
      success: true,
      message: "Documents sent for approval",
    });
  } catch (error) {
    console.log(error);
    resp.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};


exports.getDocuments = async (req, res) => {
  const userId = req.decoded.userId;
  try {

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const documents = user.uploadedDocuments;
    const location = user.location || '';
    res.status(200).json({
      success: true,
      documents: documents,
      location: location
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
}

exports.getPaymentHistory = async (req, resp) => {
  const userId = req.decoded.userId
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return resp.status(404).send({ message: 'User not found' });
    }
    resp.status(200).send(user.paymentHistory);
  } catch (err) {
    resp.status(500).send({ message: 'Error fetching payment history', error: err.message });
  }
}

/**
 * Fetch payment history for a driver.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getDriverPaymentHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const payments = await getPaymentHistoryService(id);
    return res.status(200).json(successResponse(payments, 'Payment history fetched successfully.'));
  } catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
};


exports.getVehicle = async (req, res) => {
  const userId = req.decoded.userId;
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(400).json({ message: 'No User found! Please login or signup' });
    }

    const vehicle = await vehicleModel.findById(user.primaryVehicle);

    if (user.spareVehicle) {
      const spareVehicle = await vehicleModel.findById(user.spareVehicle);
      return res.status(200).json({
        message: 'Vehicles retrieved successfully',
        primaryVehicle: vehicle,
        spareVehicle: spareVehicle
      });
    }

    return res.status(200).json({
      message: 'Vehicle retrieved successfully',
      primaryVehicle: vehicle
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

exports.checkVehicleAllocApprovals = async (req, res) => {
  const userId = req.decoded.userId;
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(401).json('User not found!');
    }

    // Check if required fields exist
    if (user.vehicleAllocPending === undefined || user.vehicleAllocApproved === undefined || user.vehicleAllocRejected === undefined) {
      return res.status(200).json({ message: 'You have yet to make any requests!' });
    }

    // If no allocation requests have been made
    if (user.vehicleAllocPending === false && user.vehicleAllocApproved === false && user.vehicleAllocRejected === false) {
      return res.status(200).json({ message: 'You have yet to make any requests!' });
    }

    // If allocation request is pending
    if (user.vehicleAllocPending === true) {
      return res.status(200).json({ message: 'Allocation request pending', vehicleAllocPending: user.vehicleAllocPending });
    }

    // If allocation request is approved
    if (user.vehicleAllocPending === false && user.vehicleAllocApproved === true) {
      return res.status(200).json({ message: 'Allocation request approved!', vehicleAllocApproved: user.vehicleAllocApproved });
    }

    // If allocation request is rejected
    if (user.vehicleAllocPending === false && user.vehicleAllocRejected === true) {
      return res.status(200).json({ message: 'Allocation request rejected!', vehicleAllocRejected: user.vehicleAllocRejected });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}



exports.checkKycApprovals = async (req, res) => {
  const userId = req.decoded.userId;
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(401).json('User not found!');
    }

    // Check if required fields exist
    if (user.kycPending === undefined || user.kycApproved === undefined || user.kycRejected === undefined) {
      return res.status(400).json({ message: 'User data is incomplete!' });
    }

    // If no KYC requests have been made
    if (user.kycPending === false && user.kycApproved === false && user.kycRejected === false) {
      return res.status(200).json({ message: 'You have yet to make any requests!' });
    }

    // If KYC is pending
    if (user.kycPending === true) {
      return res.status(200).json({ message: 'KYC pending', kycPending: user.kycPending });
    }

    // If KYC is approved
    if (user.kycPending === false && user.kycApproved === true) {
      return res.status(200).json({ message: 'KYC approved!', kycApproved: user.kycApproved });
    }

    // If KYC is rejected
    if (user.kycPending === false && user.kycRejected === true) {
      return res.status(200).json({ message: 'KYC rejected!', kycRejected: user.kycRejected });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}



exports.checkSpareApprovals = async (req, res) => {
  const userId = req.decoded.userId;
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(401).json('User not found!');
    }

    // Check if required fields exist
    if (user.spareAllocPending === undefined || user.spareAllocApproved === undefined || user.spareAllocRejected === undefined) {
      return res.status(400).json({ message: 'User data is incomplete!' });
    }

    // If no spare allocation requests have been made
    if (user.spareAllocPending === false && user.spareAllocApproved === false && user.spareAllocRejected === false) {
      return res.status(200).json({ message: 'You have yet to make any requests!' });
    }

    // If spare allocation is pending
    if (user.spareAllocPending === true) {
      return res.status(200).json({ message: 'Spare allocation pending', spareAllocPending: user.spareAllocPending });
    }

    // If spare allocation is approved
    if (user.spareAllocPending === false && user.spareAllocApproved === true) {
      return res.status(200).json({ message: 'Spare allocation approved!', spareAllocApproved: user.spareAllocApproved });
    }

    // If spare allocation is rejected
    if (user.spareAllocPending === false && user.spareAllocRejected === true) {
      return res.status(200).json({ message: 'Spare allocation rejected!', spareAllocRejected: user.spareAllocRejected });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

exports.createrOrder = async (req, res) => {
  const { orderId, orderAmount, customerEmail } = req.body;

  try {
    const orderResponse = await createOrder(orderId, orderAmount, customerEmail);
    res.json(orderResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.approvedVehicle = async (req, res) => {
  const phone = req.decoded.phone;
  try {
    const findVehicle = await orderModel.find({ type: 'Approved Request', phone: phone });

    if (findVehicle.length === 0) { // Check if the array is empty
      return res.status(404).json({ message: 'No approved vehicles found!' }); // 404 Not Found for no results
    }

    // Send the found vehicles back as response
    return res.status(200).json(findVehicle); // 200 OK for successful fetch

  } catch (error) {
    console.error("Error in approvedVehicle:", error); // Log the error for debugging
    return res.status(500).json({ error: error.message });
  }


}


/////////////////////////
//New Controller Methods
////////////////////////

/**
 * Add a new driver.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.addDriver = async (req, res) => {
  try {
    const { name, phone, locationId, vehicleId } = req.body;

    const driver = await createUser({
      name,
      phone,
      role: ROLES.DRIVER,
      locationId: locationId,
      isActive: true,
    });

    const uploadedFiles = {};

    for (let file of req.files) {
      const uploadResult = await uploadToS3(file, driver._id);
      uploadedFiles[file.fieldname] = uploadResult;
    }

    const kycRequest = await createKycRequest({
      userId: driver._id,
      uploadedDocuments: uploadedFiles,
      status: KYC_STATUS.APPROVED,
    });

    return res.status(201).json(successResponse({ driver, kycRequest }, 'Driver added successfully.'));
  } catch (error) {
    console.error('Error adding driver:', error);
    return res.status(error.status || 500).json(errorResponse(error.message || 'Failed to add driver.'));
  }
};

/**
 * Controller to add a new Admin.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.addAdmin = async (req, res) => {
  try {
    const { email, password, name, locationId, phone } = req.body;

    const newAdmin = await createAdmin({ email, password, name, locationId, phone });

    return res.status(201).json(successResponse({ user: newAdmin }, 'Admin added successfully'));
  } catch (error) {
    console.error('Error adding driver:', error);
    return res.status(error.status || 500).json(errorResponse(error.message || 'Failed to add Admin'));
  }
};

/**
 * Admin password update controller.
 * Allows the admin to update their password by providing the old password, new password, and confirmation password.
 * 
 * @param {Object} req - Express request object containing old password, new password, and confirm password.
 * @param {Object} res - Express response object for sending the response.
 */
exports.updatePasswordforadmin = async (req, res) => {
  try {
    const { oldPassword, password } = req.body;
    const adminId = req.user.userId;
    const updatedAdmin = await updatePasswordforadmin(adminId, oldPassword, password);

    return res.status(200).json(successResponse(updatedAdmin, 'Password updated successfully.'));
  } catch (error) {
    return res.status(error.statusCode || 500).json(errorResponse(error.message || 'Failed to update password.'));
  }
};

/**
 * Retrieves the dashboard statistics.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - The dashboard statistics or error response.
 */
exports.getDashboardData = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.query, req.user.locationId);
    return res.status(200).json(successResponse(stats, 'Dashboard statistics retrieved successfully.'));
  } catch (error) {
    console.error('Error retrieving dashboard statistics:', error);
    return res.status(500).json(errorResponse(error.message || 'Internal server error.'));
  }
};

/**
 * Fetches all drivers based on filters and pagination.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - Paginated list of drivers or error response.
 */
exports.fetchAllDrivers = async (req, res) => {
  const { status, locationId, search, page, limit } = req.query;
  const userLocationId = req.user.locationId;
  try {
    const result = await fetchAllDriversService({ status, search, page, limit, userLocationId, locationId });
    return res.status(200).json(successResponse(result, "Drivers retrived successfully"));
  }
  catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
}

/**
 * Switches the status of a user (active/inactive).
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - The updated user status or error response.
 */
exports.switchUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    const result = await switchUserStatusService(userId, status);
    return res.status(200).json(successResponse(result.user, result.message));
  }
  catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
}

/**
 * Retrieves the allocated primary and spare vehicles for a specific user (driver).
 * 
 * @param {Object} req - Express request object containing the user's ID in `req.params.userId`.
 * @param {Object} res - Express response object used to send the response.
 * @returns {Promise<Object>} - A success response with allocated vehicles (primary and spare) 
 *                               or an error response in case of failure.
 */
exports.getAllocatedVehicles = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await getAllocatedVehiclesService(userId);
    return res.status(200).json(successResponse(result, 'Alloted Vehicles retrieved successfully'));
  }
  catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
}

/**
 * Exports all relevant data from the system, including users, vehicle requests, payments, and vehicles.
 * 
 * @param {Object} req - Express request object. This endpoint does not require any parameters in the request.
 * @param {Object} res - Express response object used to send the response.
 * @returns {Promise<Object>} - A success response with all exported data 
 *                               or an error response in case of failure.
 */
exports.exportAllData = async (req, res) => {
  const userLocationId = req.user.locationId;
  const { locationId } = req.query;
  try {
    const data = await exportAllDataService(userLocationId, locationId);
    return res.status(200).json(successResponse(data, 'Exported all data successfully'));
  }
  catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
}

/**
 * Deletes a driver from the system by their driver ID.
 * 
 * This controller function handles the HTTP request to delete a driver, calling the `deleteDriverService` to perform the deletion logic.
 * 
 * @param {Object} req - The Express request object containing the driver ID in the URL parameters.
 * @param {Object} res - The Express response object used to send the success or error response.
 * @returns {Promise<Object>} - Returns a JSON response with the success message if the driver is deleted successfully or an error message if something fails.
 */
exports.deleteDriver = async (req, res) => {
  try {
    const {driverId} = req.params;
    const data = await deleteDriverService(driverId);
    return res.status(200).json(successResponse([], 'Driver deleted successfully'));
  }
  catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
}

/**
 * Exports a list of drivers based on the user's location or a specified location.
 * 
 * This controller function handles the HTTP request to export driver data, calling the 
 * `exportDriversService` to fetch and process the driver details.
 * 
 * @param {Object} req - The Express request object containing the following:
 *   - `req.user.locationId`: The location ID associated with the logged-in user.
 *   - `req.query.locationId`: (Optional) A location ID to filter drivers for a specific location.
 * @param {Object} res - The Express response object used to send the success or error response.
 * @returns {Promise<Object>} - Returns a JSON response containing the list of drivers and a success message, 
 * or an error message if something fails.
 */
exports.exportDrivers = async (req, res) => {
  const userLocationId = req.user.locationId;
  const { locationId } = req.query;
  try {
    const data = await exportDriversService(userLocationId, locationId);
    return res.status(200).json(successResponse(data, 'Drivers exported successfully'));
  }
  catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
}

/**
 * Updates a driver's details.
 * 
 * This controller function handles the HTTP request to update a driver's details, 
 * calling the `updateDriverService` to perform the update logic.
 * 
 * @param {Object} req - The Express request object containing the driver ID in the URL parameters and updated details in the request body.
 * @param {Object} res - The Express response object used to send the success or error response.
 * @returns {Promise<Object>} - Returns a JSON response with the success message if the driver is updated successfully or an error message if something fails.
 */
exports.updateDriver = async (req, res) => {
  try {
    const {driverId} = req.params;
    const driver = await updateDriverService(driverId, req.body);
    const uploadedFiles = {};
    for (let file of req.files) {
      const uploadResult = await uploadToS3(file, driverId);
      uploadedFiles[file.fieldname] = uploadResult;
    }
    const kycRequest = await updateKycDocuments(driverId, uploadedFiles);
    return res.status(200).json(successResponse ({driver, kycRequest}, 'Driver updated successfully'));
  }
  catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message || 'Internal server error.'));
  }
}
