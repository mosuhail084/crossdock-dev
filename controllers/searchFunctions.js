const orderModel = require("../models/orderModels");
const userModel = require("../models/userModel");
const vehicleModel = require("../models/vehicleModel");
const { usersPayments } = require("./adminController");

exports.searchVehicles = async (req, res) => {
    try {
        const { searchTerm, location } = req.query;

        // Use backticks to correctly interpolate the searchTerm in the regex pattern
        const result = await vehicleModel.find({ 
            driverName: { $regex: new RegExp(`^${searchTerm}`, 'i') },
            location: location
        });

        if (result.length == 0) {
            return res.status(201).json({ message: 'Nothing found' });
        }

        return res.status(200).json({ result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.filterVehicles = async (req,res) => {
    try {
        const {startDate, endDate, location} = req.body;

         const start = new Date(startDate);
         const end = new Date(endDate);
         console.log(start)
        const result = await vehicleModel.find({
           AllocationDate: { $gte: start, $lte: end },
           location: location
        })

        if(result.length == 0){
           return res.status(201).json({message: 'Not found!'});
        }

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
}

exports.searchRentRequests = async (req, res) => {
    try {
        const { searchTerm, location } = req.query;
         console.log(req.query)
        // Use backticks to correctly interpolate the searchTerm in the regex pattern
        const result = await orderModel.find({ 
            name: { $regex: new RegExp(`^${searchTerm}`, 'i') },
           type: 'Rental Request',
           location: location
        });

        if (result.length == 0) {
            return res.status(201).json({ message: 'Nothing found' });
        }

        return res.status(200).json({ result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.filterRent = async (req,res) => {
    try {
        const {startDate, endDate, location} = req.body;

         // Ensure the dates are in ISO string format
         const start = new Date(startDate);
         const end = new Date(endDate);
         console.log(start)
        const result = await orderModel.find({
           StartDate: { $gte: start, $lte: end },
           type: 'Rental Request',
           location: location
        })

        if(result.length == 0){
           return res.status(201).json({message: 'Not found!'});
        }

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
}

exports.searchSpareRequests = async (req, res) => {
    try {
        const { searchTerm, location } = req.query;
        console.log(searchTerm)
        console.log(location)
        // Use backticks to correctly interpolate the searchTerm in the regex pattern
        const result = await orderModel.find({ 
            name: { $regex: new RegExp(`^${searchTerm}`, 'i') },
           type: 'Spare Request',
           location: location
        });

        if (result.length == 0) {
            return res.status(201).json({ message: 'Nothing found' });
        }

        return res.status(200).json({ result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.filterSpare = async (req,res) => {
    try {
        const {startDate, endDate, location} = req.body;

         // Ensure the dates are in ISO string format
         const start = new Date(startDate);
         const end = new Date(endDate);
         console.log(start)
        const result = await orderModel.find({
           AllocationDate: { $gte: start, $lte: end },
           location: location,
           type: 'Spare Request'
        })

        if(result.length == 0){
           return res.status(201).json({message: 'Not found!'});
        }

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
}

exports.searchKYCRequests = async (req, res) => {
    try {
        const { searchTerm, location } = req.query;

        // Use backticks to correctly interpolate the searchTerm in the regex pattern
        const result = await orderModel.find({ 
            name: { $regex: new RegExp(`^${searchTerm}`, 'i') },
           type: 'KYC request',
           location: location
        });

        if (result.length == 0) {
            return res.status(201).json({ message: 'Nothing found' });
        }

        return res.status(200).json({ result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.filterKYC = async (req,res) => {
    try {
        const {startDate, endDate, location} = req.body;

         // Ensure the dates are in ISO string format
         const start = new Date(startDate);
         const end = new Date(endDate);
         console.log(start)
        const result = await orderModel.find({
           AllocationDate: { $gte: start, $lte: end },
           location: location,
           type: 'KYC request'
        })

        if(result.length == 0){
           return res.status(201).json({message: 'Not found!'});
        }

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
}

exports.searchUsers = async(req,res) => {
    try {
        const { searchTerm, location } = req.query;
         console.log(searchTerm);
         console.log(location);
        // Use backticks to correctly interpolate the searchTerm in the regex pattern
        const result = await userModel.find({ 
              name: { $regex: new RegExp(`^${searchTerm}`, 'i') },
              location: location
        }).populate([
            { path: 'primaryVehicle', select: 'vehicleNumber vehicleType status' },
            { path: 'spareVehicle', select: 'vehicleNumber vehicleType status' }
          ]);

        if (result.length == 0) {
            return res.status(201).json({ message: 'Nothing found' });
        }

        return res.status(200).json({ result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
}

exports.filterUsers = async(req,res) => {
    try {
        const { status, location } = req.query;
          console.log(req.query)
         // Use backticks to correctly interpolate the searchTerm in the regex pattern
         const result = await userModel.find({ 
            status: status,
            location: location
      });

      if (result.length == 0) {
          return res.status(201).json({ message: 'Nothing found' });
      }

      return res.status(200).json({ result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
}

exports.searchPayments = async(req,res) => {
    try {
        const { searchTerm, location } = req.query;

        console.log(req.query)
         // Use backticks to correctly interpolate the searchTerm in the regex pattern
         const users = await userModel.find({ 
            name: { $regex: new RegExp(`^${searchTerm}`, 'i') },
            location: location
      }).select('name phone paymentHistory spareVehicle')
      .populate('spareVehicle', 'vehicleNumber');

      const now = new Date();

           // Filter out users with empty payment history and sort the remaining ones by proximity to the current date and time
      const userPayments = users
          .filter(user => user.paymentHistory && user.paymentHistory.length > 0)
          .map(user => {
              const sortedPayments = user.paymentHistory.sort((a, b) => {
                  // Calculate the absolute difference in time between the payment's AllocationDate and now
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
        return res.status(500).json({ message: 'Server error', error });
    }
}
exports.filterPaymentsbySpare = async (req, res) => {
    try {
        // Find users where spareVehicle is not null (i.e., they have a spare vehicle)
        const users = await userModel.find({ 
            spareVehicle: { $ne: null } // $ne: null filters for documents where spareVehicle is not null
        }).select('name phone paymentHistory spareVehicle')
        .populate('spareVehicle', 'vehicleNumber');

        const now = new Date();

        // Filter out users with empty payment history and sort the remaining ones by proximity to the current date and time
        const userPayments = users
            .filter(user => user.paymentHistory && user.paymentHistory.length > 0)
            .map(user => {
                const sortedPayments = user.paymentHistory.sort((a, b) => {
                    // Calculate the absolute difference in time between the payment's AllocationDate and now
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
        return res.status(500).json({ message: 'Server error', error });
    }
};

exports.filterPaymentsbyDate = async (req, res) => {
    try {
        const { startDate, endDate, location } = req.body;

        // Ensure the dates are in ISO string format
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Find users where spareVehicle is not null and filter by location
        const users = await userModel.find({
            spareVehicle: { $ne: null },  // Users who have a spare vehicle
            location: location            // Filter by location
        }).select('name phone paymentHistory spareVehicle')
        .populate('spareVehicle', 'vehicleNumber');

        // Filter paymentHistory for each user based on the date range
        const filteredPayments = users.map(user => {
            const filteredHistory = user.paymentHistory.filter(payment => {
                const allocationDate = new Date(payment.AllocationDate);
                return allocationDate >= start && allocationDate <= end;
            });

            return {
                name: user.name,
                phone: user.phone,
                paymentHistory: filteredHistory,
                spareVehicle: user.spareVehicle ? user.spareVehicle.vehicleNumber : null
            };
        }).filter(user => user.paymentHistory.length > 0);  // Keep only users with payments in the date range

        if (filteredPayments.length === 0) {
            return res.status(201).json({ message: 'No payments found in the specified date range' });
        }

        return res.status(200).json({
            success: true,
            filteredPayments
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};