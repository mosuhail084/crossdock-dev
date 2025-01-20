const dotenv = require('dotenv')
dotenv.config()
const jwt = require("jsonwebtoken");
const adminModel = require('../models/adminModel');
const userModel = require('../models/userModel.js');
const axios = require('axios');
const vehicleModel = require('../models/vehicleModel.js');
const otpService = require("../utils/otpUtils.js");
const { ListObjectsV2Command, PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getObjectUrls, generatePreSignedUrl } = require('../utils/getObjectsUrls.js')
const { s3Client } = require('../utils/s3.js');
const orderModel = require('../models/orderModels.js');


exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide the required credentials!" });
    }

    const findAdmin = await adminModel.findOne({ email }).lean();
    if (!findAdmin) {
      return res
        .status(400)
        .json({ message: "You do not have access to this service!" });
    }

    if (password === findAdmin.password) {
      delete findAdmin.password;

      const token = jwt.sign({ id: findAdmin._id, location: findAdmin.location }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({ message: "Welcome!", token, findAdmin });
    }

    return res.status(400).json({ message: "Invalid account credentials" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "User Not Logged In",
      error,
    });
  }
};

exports.forgotPassword = (req, resp) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return resp.status(400).json({
        success: false,
        message: "Please provide the required credentials!",
      });
    }

    // Verify the OTP
    const isOtpValid = otpService.verifyOtp(phone, otp);
    if (isOtpValid) {
      return resp.status(200).json({
        success: true,
        message: "OTP verified successfully. You can reset your password.",
      });
    } else {
      return resp.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.error(error);
    return resp.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

exports.changePassword = async (req, resp) => {
  const { newPassword, confirmPassword, phone } = req.body;

  try {
    if (!newPassword || !confirmPassword) {
      return resp.status(400).json({
        success: false,
        message: "Please provide the required credentials!",
      });
    }

    if (newPassword !== confirmPassword) {
      return resp.status(400).json({
        success: false,
        message: "Password Mismatch",
      });
    }

    const findAdmin = await adminModel.findOne({ phone });
    if (!findAdmin) {
      return resp.status(400).json({
        success: false,
        message: "You are not a part of this system!"
      });
    }

    // Update password in database without hashing
    await adminModel.findByIdAndUpdate(findAdmin._id, {
      password: newPassword,
    });

    return resp.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (error) {
    return resp.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

exports.dashboard = async (req, resp) => {
  const { token } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = decoded.id;
    const adminData = await adminModel.findById(adminId).lean();
    const location = adminData.location;

    // Fetch vehicle and user data with pagination
    const [vehicleData, userData, vehicleCount, userCount] = await Promise.all([
      vehicleModel.find({ location }).skip((page - 1) * limit).limit(limit).lean(),
      userModel.find({ location }).skip((page - 1) * limit).limit(limit).lean(),
      vehicleModel.countDocuments({ location }),
      userModel.countDocuments({ location })
    ]);

    // Add pre-signed URLs to documents in user data
    const userDataWithUrls = await Promise.all(userData.map(async (user) => {
      const uploadedDocumentsWithUrls = await Promise.all(user.uploadedDocuments.map(async (doc) => {
        const documentPath = await generatePreSignedUrl(doc.documentPath);
        return { ...doc, documentPath };
      }));
      return { ...user, uploadedDocuments: uploadedDocumentsWithUrls };
    }));

    return resp.status(200).json({
      success: true,
      vehicleData,
      userData: userDataWithUrls,
      pagination: {
        currentPage: page,
        vehiclesTotal: vehicleCount,
        usersTotal: userCount,
        totalPagesVehicles: Math.ceil(vehicleCount / limit),
        totalPagesUsers: Math.ceil(userCount / limit),
      },
    });
  } catch (error) {
    return resp.status(500).send({
      success: false,
      message: "User not logged in",
      error,
    });
  }
};

exports.usersPayments = async (req, res) => {
  try {
    const { location } = req.query;

    // Fetch all users and populate the spareVehicle with vehicleNumber
    const users = await userModel.find({ location: location })
      .select('name phone paymentHistory spareVehicle')
      .populate('spareVehicle', 'vehicleNumber');

    const now = new Date();
    // Filter out users with empty payment history and sort the remaining ones by the latest AllocationDate
    const userPayments = users
      .filter(user => user.paymentHistory && user.paymentHistory.length > 0)
      .map(user => {
        // Sort paymentHistory by the latest AllocationDate
        const sortedPayments = user.paymentHistory.sort((a, b) => {
          const diffA = Math.abs(now - new Date(a.AllocationDate));
          const diffB = Math.abs(now - new Date(b.AllocationDate));
          return diffA - diffB;  // Sort by closest time to now
        });

        return {
          name: user.name,
          phone: user.phone,
          paymentHistory: sortedPayments,
          spareVehicle: user.spareVehicle ? user.spareVehicle.vehicleNumber : null
        };
      });

    res.status(200).json({
      success: true,
      userPayments
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      error: error.message
    });
  }
};


exports.getKycDocuments = async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await userModel.find({ phone: phone });

    if (!user) {
      return res.status(400).send({ message: 'No User Found!' });
    }
    const folderKey = `${phone}/`; // Assuming the folder key is in this format

    const urls = await getObjectUrls(process.env.BUCKET_NAME, folderKey);

    return res.status(200).send({ documents: urls, driverName: user.name, contactNumber: user.phone });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      error: error.message
    });
  }
};

exports.kycApproval = async (req, res) => {
  try {
    const { phone, action } = req.body;


    if (action === 'Approved') {
      const documents = [
        {
          documentType: "UserImage",
          documentPath: `https://${process.env.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${phone}/UserImage`
        },
        {
          documentType: "PanCard",
          documentPath: `https://${process.env.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${phone}/PanCard`
        },
        {
          documentType: "AadharCard",
          documentPath: `https://${process.env.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${phone}/AadharCard`
        },
        {
          documentType: "DriversLicense",
          documentPath: `https://${process.env.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${phone}/DriversLicense`
        }
      ];

      const order = await orderModel.findOneAndDelete({ phone: phone, type: 'KYC request' });

      await userModel.findOneAndUpdate(
        { phone: phone },
        {
          $set: {
            uploadedDocuments: documents
          },
          kycApproved: true,
          kycPending: false,
          kycRejected: false,
          location: order.location
        }
      );

      await orderModel.deleteMany({ phone: phone, type: 'KYC request' });

      return res.status(200).send({ success: true, message: 'Approved' });
    } else {

      await userModel.findOneAndUpdate(
        { phone: phone },
        {
          kycApproved: false,
          kycRejected: true,
          kycPending: false,
        }
      );

      const listParams = {
        Bucket: process.env.BUCKET_NAME,
        Prefix: `${phone}/`
      };

      const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        return;
      }

      const deleteParams = {
        Bucket: process.env.BUCKET_NAME,
        Delete: {
          Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key }))
        }
      };

      // Delete the objects
      await s3Client.send(new DeleteObjectsCommand(deleteParams));

      await orderModel.deleteMany({ phone: phone, type: 'KYC request' });

      return res.status(200).send({ message: 'Rejected' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      error: error.message
    });
  }
};


exports.vehicleAllocation = async (req, res) => {
  const { driverName, contactNumber, startDate, vehicleType, vehicleNumber, action } = req.body;

  if (!driverName || !contactNumber || !startDate || !vehicleType || !vehicleNumber || !action) {
    return res.status(401).json({ message: 'Please provide proper information!' });
  }

  try {
    // Find an inactive vehicle of the specified type
    const order = await orderModel.findOne({ phone: contactNumber, type: 'Rental Request' });

    if (!order) {
      return res.status(401).json({ message: 'No Order found' });
    }

    if (action === "Approved") {
      const user = await userModel.findOne({ phone: contactNumber });
      if (!user) {
        return res.status(400).json({ message: 'No User Found!' });
      }

      if (user.primaryVehicle != null) {
        await orderModel.deleteMany({ phone: contactNumber, type: 'Rental Request' });
        return res.status(400).json({ message: 'User Already has a vehicle!' });

      }


      const updateResult = await userModel.findByIdAndUpdate(user._id, {
        vehicleAllocPending: false,
        vehicleAllocApproved: true,
        vehicleAllocRejected: false
      });

      if (!updateResult) {
        console.error('Failed to update user model');
      }

      // Delete all matching orders with the same contactNumber and type
      await orderModel.deleteMany({ phone: contactNumber, type: 'Rental Request' });


      const newOrder = new orderModel({
        phone: contactNumber,
        name: driverName,
        vehicleType: vehicleType,
        vehicleNumber: vehicleNumber,
        type: 'Approved Request'
      })

      newOrder.save();
      return res.status(200).json({ message: 'Vehicle rental approved!' });
    } else {
      const user = await userModel.findOne({ phone: contactNumber });
      if (!user) {
        return res.status(400).json({ message: 'No User Found!' });
      }

      await userModel.findByIdAndUpdate(user._id, {
        vehicleAllocPending: false,
        vehicleAllocRejected: true,
        vehicleAllocApproved: false
      });

      // Delete all matching orders with the same contactNumber and type
      await orderModel.deleteMany({ phone: contactNumber, type: 'Rental Request' });

      return res.status(200).json({ message: 'Vehicle rental rejected!' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};



exports.spareAllocation = async (req, res) => {
  const { driverName, contactNumber, startDate, action } = req.body;

  if (!driverName || !contactNumber || !startDate || !action) {
    return res.status(401).json({ message: 'Please provide proper info!' });
  }

  try {
    const order = await orderModel.findOne({ phone: contactNumber, type: 'Spare Request' });

    if (!order) {
      return res.status(401).json({ message: 'No Order found' });
    }

    const user = await userModel.findOne({ phone: contactNumber }).populate({
      path: 'primaryVehicle',
      select: 'vehicleNumber vehicleType'
    });

    if (!user) {
      return res.status(400).json({ message: 'Please login or signup first!' });
    }

    if (action === "Approved") {
      const currentVehicleId = user.primaryVehicle;
      const lastPayment = user.paymentHistory[user.paymentHistory.length - 1];

      if (!lastPayment) {
        return res.status(400).json({ message: 'No rental history found for the user.' });
      }

      const findVehicle = await vehicleModel.findOne({
        vehicleType: user.primaryVehicle.vehicleType,
        vehicleNumber: user.primaryVehicle.vehicleNumber,
        status: 'inactive',
        _id: { $ne: currentVehicleId } // Exclude the current vehicle from the search
      }).lean();

      if (!findVehicle) {
        return res.status(400).json({ message: 'No vehicle is available at the moment, sorry!' });
      }

      // Update the current vehicle status to 'Under-Repair'
      await vehicleModel.updateOne(
        { _id: currentVehicleId },
        { status: 'Under-Repair' }
      );

      // Update the found vehicle's details
      await vehicleModel.updateOne(
        { _id: findVehicle._id },
        {
          driverName: user.name,
          driverContactNumber: user.phone,
          AllocationDate: lastPayment.AllocationDate,
          EndDate: lastPayment.EndDate,
          rentalValue: lastPayment.rentalValue,
          status: 'Active',
          location: order.location,
          noOfDays: lastPayment.noOfDays
        }
      );

      // Update the user's spare vehicle and payment history
      const updateResult = await userModel.updateOne(
        { _id: user._id },
        {
          spareVehicle: findVehicle._id,
          spareAllocPending: false,
          spareAllocApproved: true,
          spareAllocRejected: false,
        }
      );

      if (!updateResult) {
        console.error('Failed to update user model');
      }

      // Delete the spare request order
      await orderModel.deleteMany({ phone: contactNumber, type: 'Spare Request' });

      const spareVehicle = await vehicleModel.findById(findVehicle._id).lean();

      return res.status(200).json({ message: 'Spare allocated successfully!', spareVehicle });
    } else {
      await userModel.updateOne(
        { _id: user._id },
        {
          spareVehicle: null,
          spareAllocPending: false,
          spareAllocApproved: false,
          spareAllocRejected: true,
        }
      );

      await orderModel.deleteMany({ phone: contactNumber, type: 'Spare Request' });

      return res.status(200).json({ message: 'Request rejected!' });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};
exports.vehicleDeallocation = async (req, res) => {
  const { driverName, contactNumber, startDate, vehicleType } = req.body;

  if (!driverName || !contactNumber || !startDate || !vehicleType) {
    return res.status(401).json({ message: 'Please provide proper info!' })
  }

  try {

    const user = await userModel.findOne({ phone: contactNumber });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const findVehicle = await vehicleModel.findOneAndUpdate({ _id: user.primaryVehicle }, {
      status: 'Inactive',
      driverContactNumber: null,
      driverName: '',
      rentalValue: 0,
      AllocationDate: null,
      EndDate: null,
      location: ''
    })

    if (!findVehicle) {
      return res.status(400).json({ message: 'Vehicle not found!' });
    }

    return res.status(200).json({ message: 'Vehicle deallocated successfully!' })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }


}

exports.getRentalRequests = async (req, res) => {
  try {
    const { location } = req.query
    const data = await orderModel.find({ type: 'Rental Request', location: location });

    if (data.length <= 0) {
      return res.status(201).json({ message: 'No Requests' });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

exports.getSpareRequests = async (req, res) => {
  try {
    const { location } = req.query
    const data = await orderModel.find({ type: 'Spare Request', location: location });

    if (data.length <= 0) {
      return res.status(201).json({ message: 'No Requests' });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}



exports.deleteUser = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await userModel.findOneAndDelete({ phone: phone });

    if (!user) {
      return res.status(400).json({ message: 'No User found!' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

exports.userEdit = async (req, resp) => {
  try {
    const files = req.files;
    // const { location } = req.body;
    const { phone } = req.body;
    if (!files) {
      return resp.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const documentPromises = Object.keys(files).map(async (key) => {
      const file = files[key][0]; // Since each field has maxCount: 1, take the first file
      const params = {
        Bucket: process.env.BUCKET_NAME, // replace with your bucket name
        Key: `${phone}/${file.fieldname}`, // Use phone number in the Key
        Body: file.buffer,
        ContentType: file.mimetype
      };

      await s3Client.send(new PutObjectCommand(params));

      return {
        documentType: file.fieldname,
        documentPath: `https://cross-dock.s3.ap-south-1.amazonaws.com/${phone}/${file.fieldname}`
      };
    });

    const documents = await Promise.all(documentPromises);

    const user = await userModel.findOneAndUpdate({ phone: phone }, {
      uploadedDocuments: documents
    })




    if (!user) {
      return resp.status(400).json({ success: false, message: 'No user found, please login or signup first!' });
    }

    return resp.status(200).json({ message: 'User info updated!' });
  } catch (error) {
    console.log(error);
    return resp.status(500).json({ message: 'Server error', error });

  }


}

exports.userInfo = async (req, res) => {
  try {
    const { phone } = req.params;

    const user = await userModel.findOne({ phone: phone });

    if (!user) {
      return res.status(400).json({ message: 'No User found!' });
    }

    let primaryVehicle = null;
    let spareVehicle = null;

    if (user.primaryVehicle) {
      primaryVehicle = await vehicleModel.findById(user.primaryVehicle);
    }

    if (user.spareVehicle) {
      spareVehicle = await vehicleModel.findById(user.spareVehicle);
    }

    return res.status(200).json({ user: user, primaryVehicle: primaryVehicle, spareVehicle: spareVehicle || '' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}


exports.getKycRequests = async (req, res) => {
  try {
    const { location } = req.query;

    const data = await orderModel.find({ type: 'KYC request', location: location }).sort({ createdAt: -1 });

    if (data.length <= 0) {
      return res.status(200).json({ message: 'No Requests' });
    }

    const dataWithPreSignedUrls = await Promise.all(
      data.map(async order => {
        const documentsWithUrls = await Promise.all(
          order.documents.map(async doc => ({
            ...doc.toObject(),
            documentPath: await generatePreSignedUrl(doc.documentPath)
          }))
        );

        return { ...order.toObject(), documents: documentsWithUrls };
      })
    );

    return res.status(200).json({ data: dataWithPreSignedUrls });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};


exports.enableVehicle = async (req, res) => {
  const { vehicleNumber } = req.body;

  if (!vehicleNumber) {
    return res.status(400).json({ message: 'Vehicle number is required!' });
  }

  try {
    const findVehicle = await vehicleModel.findOneAndUpdate(
      { vehicleNumber },
      { action: 'enable' },
      { new: true }
    );

    if (!findVehicle) {
      return res.status(404).json({ message: 'Vehicle not found!' });
    }

    // Define and send the mutation
    try {
      const response = await axios.post('https://log9-api.aquilatrack.com/graphql', {
        query: `
          mutation updateDeviceCommandsTable($uniqueId: String!, $command: String!, $device_password: String!, $use_sms: Boolean!) {
            updateDeviceCommandsTable(uniqueId: $uniqueId, command: $command, device_password: $device_password, use_sms: $use_sms) {
              message
            }
          }
        `,
        variables: {
          uniqueId: vehicleNumber,
          command: 'CHECK_SPEED_MOBILIZE',
          device_password: process.env.device_password,
          use_sms: false,
        },
      }, {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      });

      console.log(response.data);
    } catch (error) {
      console.error('Error performing mutation:', error);
    }
    return res.status(200).json('Vehicle enabled!');
  } catch (error) {
    console.error('Error performing mutation:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.disableUser = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await userModel.findOneAndUpdate({ phone: phone }, {
      status: 'Inactive'
    }, { new: true })

    if (!user) {
      return res.status(401).json({ message: 'No user found!' });
    }

    return res.status(200).json({ message: 'User disabled', user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

exports.enableUser = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await userModel.findOneAndUpdate({ phone: phone }, {
      status: 'Active',
    },
      { new: true })

    if (!user) {
      return res.status(401).json({ message: 'No user found!' });
    }

    return res.status(200).json({ message: 'User enabled', user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}



exports.createVehicle = async (req, res) => {
  const { vehicleType, vehicleNumber, location } = req.body;

  if (!vehicleType || !vehicleNumber || !location) {
    return res.status(400).json({ message: 'Please provide all required credentials!' });
  }

  try {
    const newVehicle = await vehicleModel.create({
      vehicleType,
      vehicleNumber,
      status: 'inactive',
      action: 'enable',
      location
    });

    return res.status(200).json({ message: 'Vehicle Added!', vehicle: newVehicle });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

exports.inactiveVehicles = async (req, res) => {
  try {
    const vehicleData = await vehicleModel.find({ status: 'Inactive' });

    if (vehicleData.length === 0) {
      return res.status(201).json({ message: 'No inactive vehicles' });
    }

    return res.status(200).json({ vehicleData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

exports.getActiveVehicleByType = async (req, res) => {
  try {
    const { type, location } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Vehicle type is required' });
    }
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    // Find vehicles that are active and match the specified type
    const vehicleData = await vehicleModel.find({ status: 'active', action: 'enable', vehicleType: type, location: location }).select('vehicleNumber');

    if (vehicleData.length === 0) {
      return res.status(200).json({ message: 'No active vehicles found for the specified type' });
    }

    return res.status(200).json({ vehicleData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAdminStats = async (req, resp) => {
  const { token } = req.params;

  try {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return resp.json({ Status: "Error with token" });
      } else {
        const adminId = decoded.id;
        const adminData = await adminModel.findById(adminId);

        if (!adminData) {
          return resp.status(404).json({ Status: "Admin not found" });
        }

        const adminLocation = adminData.location;

        const userCount = await vehicleModel.countDocuments({
          location: adminLocation,
        });

        const totalPaymentReceived = await userModel.aggregate([
          { $match: { location: adminLocation } },
          { $unwind: "$paymentHistory" },
          {
            $group: {
              _id: null,
              totalPayment: { $sum: "$paymentHistory.rentalValue" },
            },
          },
          { $project: { _id: 0, totalPayment: 1 } },
        ]);

        const activeVehicleCount = await vehicleModel.countDocuments({
          status: "active",
          location: adminLocation,
        });
        const inactiveVehicleCount = await vehicleModel.countDocuments({
          status: "inactive",
          location: adminLocation,
        });
        const spareVehicleCount = await vehicleModel.countDocuments({
          status: "spare",
          location: adminLocation,
        });
        const underRepairVehicleCount = await vehicleModel.countDocuments({
          status: "underRepair",
          location: adminLocation,
        });

        const twoWheelerCount = await vehicleModel.countDocuments({
          vehicleType: "2-wheeler",
          location: adminLocation,
        });
        const threeWheelerCount5 = await vehicleModel.countDocuments({
          vehicleType: "3-wheeler",
          location: adminLocation,
        });
        const totalInventoryCount = await vehicleModel.countDocuments({
          location: adminLocation,
        });
        const threeWheelerCount10 = await vehicleModel.countDocuments({
          vehicleType: "3-wheeler",
          location: adminLocation,
        })
        const fourWheelerCount = await vehicleModel.countDocuments({
          vehicleType: "4-wheeler",
          location: adminLocation
        })


        resp.status(200).json({
          success: true,
          userCount,
          totalPaymentReceived: totalPaymentReceived[0]?.totalPayment || 0,
          activeVehicleCount,
          inactiveVehicleCount,
          spareVehicleCount,
          twoWheelerCount,
          threeWheelerCount10,
          threeWheelerCount5,
          totalInventoryCount,
          underRepairVehicleCount,
          fourWheelerCount
        });
      }
    });
  } catch (error) {
    return resp.status(500).send({
      success: false,
      message: "Unable to fetch statistics",
      error,
    });
  }
};

exports.addUser = async (req, res) => {
  const { name, phone, location } = req.body;
  const files = req.files;

  if (!name || !phone || !location) {
    return res.status(400).json({ message: 'Name, Location and phone number are required' });
  }

  const requiredFiles = ['UserImage', 'PanCard', 'AadharCard', 'DriversLicense'];
  if (!files || !requiredFiles.every(fileType => files[fileType])) {
    const missingFiles = requiredFiles.filter(fileType => !files || !files[fileType]);
    return res.status(400).json({ message: `${missingFiles.join(', ')} are required` });
  }

  try {
    const existingUser = await userModel.countDocuments({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists! Use a different phone number' });
    }

    const uploadedDocuments = await Promise.all(requiredFiles.map(async (fileType) => {
      const file = files[fileType][0];
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${phone}/${file.fieldname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3Client.send(new PutObjectCommand(params));
      return {
        documentType: file.fieldname,
        documentPath: `https://${process.env.BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${phone}/${file.fieldname}`,
      };
    }));

    await new userModel({ name, phone, location, uploadedDocuments }).save();

    return res.status(200).json({ message: 'User added successfully!' });
  } catch (error) {
    console.error('Error adding user:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

exports.usersPaymentHistory = async (req, res, next) => {
  try {
    const { token } = req.params;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json({ Status: "Error with token" });
      } else {
        const adminId = decoded.id;

        const adminData = await adminModel.findById(adminId);

        if (!adminData) {
          return res.status(404).json({ Status: "Admin not found" });
        }

        const adminLocation = adminData.location;

        const usersPaymentHistory = await userModel.find(
          { location: adminLocation },
          'paymentHistory'
        );

        return res.json({ Status: "Success", usersPaymentHistory });
      }
    });
  } catch (error) {
    next(error);
  }
};