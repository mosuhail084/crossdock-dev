const dotenv=require('dotenv')
dotenv.config()
const superAdminModel = require("../models/superAdminModel");
const adminModel = require("../models/adminModel");
const vehicleModel = require("../models/vehicleModel");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { generatePreSignedUrl } = require('../utils/getObjectsUrls');

exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide the required credentials!" });
    }

    const findAdmin = await superAdminModel.findOne({ email }).lean();
    if (!findAdmin) {
      return res
        .status(400)
        .json({ message: "You do not have access to this service!" });
    }
    if (password === findAdmin.password) {
      delete findAdmin.password;

      const token = jwt.sign({ id: findAdmin._id}, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({ message: "Welcome!", token, findAdmin });
    }

    return res.status(400).json({ message: "Invalid accound credentials" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "User Not Logged In",
      error,
    });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const { location } = req.body;
    const { token } = req.params;

    if (!location) {
      return res.status(400).json({ message: "Please provide a location!" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [vehicleData, userData, adminData, vehicleCount, userCount, adminCount] = await Promise.all([
      vehicleModel.find({ location }).skip((page - 1) * limit).limit(limit).lean(),
      userModel.find({ location }).skip((page - 1) * limit).limit(limit).lean(),
      adminModel.find({ location }).skip((page - 1) * limit).limit(limit).lean(),
      vehicleModel.countDocuments({ location }),
      userModel.countDocuments({ location }),
      adminModel.countDocuments({ location })
    ]);

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ Status: "Error with token" });
      }

      const userDataWithUrls = await Promise.all(userData.map(async user => {
        const uploadedDocumentsWithUrls = await Promise.all(user.uploadedDocuments.map(async doc => ({
          ...doc,
          documentPath: await generatePreSignedUrl(doc.documentPath)
        })));
        return { ...user, uploadedDocuments: uploadedDocumentsWithUrls };
      }));

      return res.status(200).json({
        success: true,
        vehicleData,
        userData: userDataWithUrls,
        adminData,
        pagination: {
          currentPage: page,
          vehiclesTotal: vehicleCount,
          usersTotal: userCount,
          adminsTotal: adminCount,
          totalPagesVehicles: Math.ceil(vehicleCount / limit),
          totalPagesUsers: Math.ceil(userCount / limit),
          totalPagesAdmins: Math.ceil(adminCount / limit),
        },
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Failed to retrieve dashboard data",
      error,
    });
  }
};

exports.userPaymentHistory = async (req, res, next) => {
  try {
    const usersPaymentHistory = await userModel.find(
      { paymentHistory: { $ne: [] } }, 
      'paymentHistory' 
    );
    
    return res.status(200).json({data:usersPaymentHistory}) ;
} catch (error) {
  next(error)
 }
}