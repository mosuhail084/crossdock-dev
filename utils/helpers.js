exports.convertToISODate = (dateString) => {
  // Parse the date string (assuming 'dd MMMM yyyy' format)
  const [day, monthName, year] = dateString.split(' ');
  
  // Define month names array to get the correct month index
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Validate and convert month name to month index
  const monthIndex = monthNames.indexOf(monthName);
  if (isNaN(day) || isNaN(year) || monthIndex === -1) {
    throw new Error(`Invalid date components: ${dateString}`);
  }

  // Create a Date object
  const date = new Date(year, monthIndex, day);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid Date object created: ${date}`);
  }

  // Get the current time and set it to the date object
  const now = new Date();
  date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

  // Adjust for IST (UTC+5:30)
  const ISTOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const ISTTime = new Date(date.getTime() + ISTOffset);

  // Format the time as an ISO string
  const isoString = ISTTime.toISOString().split('.')[0]; // Remove milliseconds
  const isoISTString = isoString.replace('Z', '+05:30'); // Replace 'Z' with IST offset

  return isoISTString;
};


  


// Utility function to convert milliseconds to a readable format
exports.convertMillisecondsToReadableFormat = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

exports.formatTime = (isoString) => {
  // Split the ISO string by 'T' to separate the date and time
  console.log(isoString);
 // Split the ISO string by 'T' to separate the date and time
 const parts = isoString.split('T');
  
 if (parts.length < 2) {
   throw new Error('Invalid ISO string format');
 }
 
 // Further split the time part by '.' to remove the milliseconds and timezone
 const timePart = parts[1].split('.')[0];
 
 return timePart;
}