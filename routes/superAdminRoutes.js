const express = require("express");
const { dashboard, loginController, userPaymentHistory } = require("../controllers/superAdminController");

const router=express.Router();


router.post("/login",loginController)
router.post('/dashboard/:token', dashboard)

router.get('/userPayment', userPaymentHistory)


module.exports= router;