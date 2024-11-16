const cron = require('node-cron');
const dotenv=require('dotenv')
const userModel = require('../models/userModel');
const vehicleModel = require('../models/vehicleModel.js');
const axios = require('axios');

dotenv.config()

const deactivateExpiredVehicles = async () => {
  // Get the start of today (midnight)
  let startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  console.log(`Checking for expired vehicles as of ${startOfToday.toISOString()}`);

  try {
    // Find all vehicles with an EndDate before today and status not yet "Inactive"
    const expiredVehicles = await vehicleModel.find({
      EndDate: { $lt: startOfToday },
      status: { $ne: 'Inactive' }
    });

    for (let vehicle of expiredVehicles) {
      // Deactivate the vehicle
      await vehicleModel.findByIdAndUpdate(vehicle._id, { status: 'Inactive' });
      
      // Find the user associated with this vehicle and update their cronJobScheduled status
      const user = await userModel.findOne({ primaryVehicle: vehicle._id });
      if (user) {
        await userModel.findByIdAndUpdate(user._id, { cronJobScheduled: false });
      }

      console.log(`Vehicle ${vehicle._id} and Vehicle Number ${vehicle.vehicleNumber} deactivated and user ${user ? user._id : 'unknown'} updated.`);
    }

  } catch (error) {
    console.error(`Error during expired vehicle deactivation: ${error.message}`);
  }
};

// Schedule the above function to run every 1 hour
cron.schedule('0 * * * *', deactivateExpiredVehicles);

console.log('Cron job scheduled to run every hour.');

exports.scheduleVehicleDeactivation = async (user, endTime) => {
  let cronExpression = `${endTime.getSeconds()} ${endTime.getMinutes()} ${endTime.getHours()} ${endTime.getDate()} ${endTime.getMonth() + 1} *`;

  console.log(`Scheduling vehicle deactivation for user ${user._id} with endTime: ${endTime}`);

  console.log(`Scheduling cron job with expression: ${cronExpression}`);
  cron.schedule(cronExpression, async () => {
    console.log(`Cron job started at ${new Date().toISOString()} for user ${user._id} and vehicle ${user.primaryVehicle}`);
    try {
      
      const findVehicle = await vehicleModel.findByIdAndUpdate(user.primaryVehicle, { status: 'Inactive' });
      if(findVehicle.status === 'Under-Repair'){
        const spare = await vehicleModel.findByIdAndUpdate(user.spareVehicle, {status: 'Inactive'});
        disable(spare.vehicleNumber);
      }
      await userModel.findByIdAndUpdate(user._id, { cronJobScheduled: false });
      disable(findVehicle.vehicleNumber);
      console.log(`Vehicle ${user.primaryVehicle} deactivated and user ${user._id} updated at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`Error during cron job execution: ${error.message}`);
    }
  });
};

exports.disableTimer = async(user) => {
    try{
      
       if(!user.spareVehicle){
        const findVehicle = await vehicleModel.findById(user.primaryVehicle);
        let startTime = findVehicle.disabledTime

          // Add 2 hours to the startTime
        startTime.setHours(startTime.getHours() + 2);

        let cronExpression = `${startTime.getSeconds()} ${startTime.getMinutes()} ${startTime.getHours()} ${startTime.getDate()} ${startTime.getMonth() + 1} *`;
        cron.schedule(cronExpression, () => {
          disable(findVehicle.vehicleNumber);
        })
       }else{
        const spare = await vehicleModel.findById(user.spareVehicle);
        let startTime = spare.disabledTime

           // Add 2 hours to the startTime
           startTime.setHours(startTime.getHours() + 2);

        let cronExpression = `${startTime.getSeconds()} ${startTime.getMinutes()} ${startTime.getHours() + 2} ${startTime.getDate()} ${startTime.getMonth() + 1} *`;
        cron.schedule(cronExpression, () => {
          disable(findVehicle.vehicleNumber);
        })
       }
    }catch(error){
        console.error(`Error during cron job execution: ${error.message}`);
    }
}

async function disable(vehicleNumber){
       // Define the mutation with placeholders for variables
       const mutation = `
       mutation updateDeviceCommandsTable(
         $uniqueId: String!,
         $command: String!,
         $device_password: String!,
         $use_sms: Boolean!
       ) {
         updateDeviceCommandsTable(
           uniqueId: $uniqueId,
           command: $command,
           device_password: $device_password,
           use_sms: $use_sms
         ) {
           message
         }
       }
     `;
 
     // Define the variables for the mutation
     const variables = {
       uniqueId: vehicleNumber,
       command: 'CHECK_SPEED_IMMOBILIZE',
       device_password: process.env.device_password,
       use_sms: false,
     };
 
     // Send the POST request with the mutation, variables, and authorization header
     const response = await axios.post(
       'https://log9-api.aquilatrack.com/graphql',
       {
         query: mutation,
         variables: variables,
       },
       {
         headers: {
           Authorization: `Bearer ${process.env.TOKEN}`, // Replace with your actual token
         },
       }
     );
 
     // Handle the response
     console.log(response.data);
}