const multer = require('multer');
const storage = multer.memoryStorage(); // use memory storage if you want to process files before saving
const upload = multer({ storage });

exports.uploadFields = upload.fields([
  { name: 'UserImage', maxCount: 1 },
  { name: 'PanCard', maxCount: 1 },
  { name: 'AadharCard', maxCount: 1 },
  { name: 'DriversLicense', maxCount: 1 }
]);