const XLSX = require('xlsx');
const fs = require('fs');
const moment = require('moment');
const vehicleModel = require('../models/vehicleModel');
const orderModel = require('../models/orderModels');
const userModel = require('../models/userModel');

exports.downloadVehicles = async (req, res) => {
    try {
        const { location } = req.body;

        const vehicleData = await vehicleModel.find({ location: location });
        
        // Format data
        const formattedData = vehicleData.map((data) => ({
            "Type": data.vehicleType,
            "Vehicle Number": data.vehicleNumber,
            "Status": data.status,
            "Action": data.action,
            "Allocation Date": moment(data.AllocationDate).format('DD-MM-YY'),
            "End Date": moment(data.EndDate).format('DD-MM-YY'),
            "Driver Contact Number": data.driverContactNumber,
            "Driver Name": data.driverName,
            "Location": data.location,
            "Rental Value": data.rentalValue
        }));

        // Convert JSON to sheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Data");

        // Write the workbook to a buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set the response headers
        res.setHeader('Content-Disposition', 'attachment; filename=vehicleData.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the buffer as a response
        res.send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};


exports.downloadRent = async (req, res) => {
    try {
        const { location } = req.body;

        const vehicleData = await orderModel.find({ location: location, type: 'Rental Request' });
        
        // Format data
        const formattedData = vehicleData.map((data) => ({
            "Type": data.vehicleType,
            "Allocation Date": moment(data.StartDate).format('DD-MM-YY'),
            "End Date": moment(data.EndDate).format('DD-MM-YY'),
            "Driver Contact Number": data.phone,
            "Driver Name": data.name,
            "Location": data.location,
            "No of Days": data.noOfDays,
            "Rental Value": data.rentalValue,
        }));

        // Convert JSON to sheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rental Request Data");

        // Write the workbook to a buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set the response headers
        res.setHeader('Content-Disposition', 'attachment; filename=rentalRequestData.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the buffer as a response
        res.send(buffer);
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.downloadSpare = async (req, res) => {
    try {
        const { location } = req.body;

        const vehicleData = await orderModel.find({ location: location, type: 'Spare Request' });
        
        // Format data
        const formattedData = vehicleData.map((data) => ({
            "Type": data.vehicleType,
            "Allocation Date": moment(data.StartDate).format('DD-MM-YY'),
            "End Date": moment(data.EndDate).format('DD-MM-YY'),
            "Driver Contact Number": data.phone,
            "Driver Name": data.name,
            "Location": data.location,
            "No of Days": data.noOfDays,
            "Rental Value": data.rentalValue,
        }));

        // Convert JSON to sheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Spare Request Data");

        // Write the workbook to a buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set the response headers
        res.setHeader('Content-Disposition', 'attachment; filename=spareRequestData.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the buffer as a response
        res.send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.downloadKYC = async (req, res) => {
    try {
        const { location } = req.body;

        const vehicleData = await orderModel.find({ location: location, type: 'KYC request' });
        
        // Format data
        const formattedData = vehicleData.map((data) => ({
            "Start Date": moment(data.StartDate).format('DD-MM-YY'),
            "End Date": moment(data.EndDate).format('DD-MM-YY'),
            "Driver Contact Number": data.phone,
            "Driver Name": data.name,
            "Location": data.location,
            "User Image": data.documents.find((doc) => doc.documentType === 'UserImage')?.documentPath || '',
            "Aadhar Card": data.documents.find((doc) => doc.documentType === 'AadharCard')?.documentPath || '',
            "Pan Card": data.documents.find((doc) => doc.documentType === 'PanCard')?.documentPath || '',
            "Driver License": data.documents.find((doc) => doc.documentType === 'DriversLicense')?.documentPath || ''
        }));

        // Convert JSON to sheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "KYC Request Data");

        // Write the workbook to a buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set the response headers
        res.setHeader('Content-Disposition', 'attachment; filename=kycRequestData.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the buffer as a response
        res.send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.downloadUsers = async (req, res) => {
    try {
        const { location } = req.body;

        // Find users and populate primaryVehicle
        const userData = await userModel.find({ location: location }).populate('primaryVehicle', 'vehicleNumber');
        
        // Format data with null checks
        const formattedData = userData.map((data) => ({
            "Contact Number": data.phone,
            "Name of Driver": data.name,
            "Location": data.location,
            "Status": data.status,
            "Vehicle Allotted": data.primaryVehicle ? data.primaryVehicle.vehicleNumber : 'N/A' // Handle null or undefined
        }));

        // Convert JSON to sheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "User Data");

        // Write the workbook to a buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set the response headers
        res.setHeader('Content-Disposition', 'attachment; filename=userData.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the buffer as a response
        res.send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.downloadPayments = async (req, res) => {
    try {
        const { location } = req.body;

        // Fetch all users and populate the spareVehicle with vehicleNumber
        const users = await userModel.find({ location: location })
            .select('name phone paymentHistory spareVehicle status')
            .populate('spareVehicle', 'vehicleNumber');

        // Get the current time
        const now = new Date();
        console.log(users);

        // Filter out users with empty payment history and sort the remaining ones by the latest AllocationDate
        const userPayments = users
            .filter(user => user.paymentHistory && user.paymentHistory.length > 0)
            .map(user => {
                // Sort paymentHistory by the latest AllocationDate
                const sortedPayments = user.paymentHistory.sort((a, b) => {
                    const diffA = Math.abs(now - new Date(a.AllocationDate));
                    const diffB = Math.abs(now - new Date(b.AllocationDate));
                    return diffB - diffA;  // Sort by closest time to now
                });

                return {
                    name: user.name,
                    phone: user.phone,
                    paymentHistory: sortedPayments,
                    spareVehicle: user.spareVehicle ? user.spareVehicle.vehicleNumber : null,
                    status: user.status // Ensure status is included
                };
            });

        // Format data with null checks
        const formattedData = userPayments.map(data => {
            const latestPayment = data.paymentHistory[0]; // Assuming sortedPayments is sorted in descending order
            return {
                "Paid on Date": moment(latestPayment.AllocationDate).format('DD-MM-YY'),
                "Name of Driver": data.name,
                "Status": data.status || 'N/A',
                "Vehicle Allotted": latestPayment.vehicleNumber || 'N/A',
                "Spare Vehicle": data.spareVehicle || 'N/A',
                "No of Days": latestPayment.noOfDays || 'N/A'
            };
        });

        // Log the formatted data to verify
        console.log(formattedData);

        // Convert JSON to sheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "User Payments Data");

        // Write the workbook to a buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set the response headers
        res.setHeader('Content-Disposition', 'attachment; filename=userPayments.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the buffer as a response
        res.send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};