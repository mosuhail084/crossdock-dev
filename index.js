const connnectDatabase = require('./config/db.js')
const swagger = require('./config/swagger.js');
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors');
const multer = require('multer');

dotenv.config()
const app = express();
const userRoute = require('./routes/userRoute.js');
const authRoute = require('./routes/authRoutes.js');
const vehicleRoute = require('./routes/vehicleRoutes.js');
const locationRoute = require('./routes/locationRoutes.js');
const kycRoute = require('./routes/kycRoutes.js');

const { authMiddleware } = require('./middleware/authMiddleware.js');

require('./utils/cronScheduler.js');

connnectDatabase()
swagger(app);
app.use(express.json())
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:8000', 'http://localhost:3000']
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }),
)

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(upload.any());


app.use('/api/v1/auth', authRoute);
app.use('/api/v1/user', authMiddleware, userRoute);
app.use('/api/v1/location', authMiddleware, locationRoute);
app.use('/api/v1/vehicle', authMiddleware, vehicleRoute);
app.use('/api/v1/kyc', authMiddleware, kycRoute);


// app.use('/api/v1/user',userRoute);
// app.use('/api/v1/admin', adminRoute);
// app.use('/api/v1/super-admin',superadmin);



const port = process.env.PORT || 8000
app.listen(port, () => {
  console.log(`Server started at Port ${port}`);
})