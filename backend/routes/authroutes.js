const express = require("express");
const router = express.Router();

const authController = require("../controllers/authcontroller");

// --------------------- ROUTES ---------------------

// Step 1: Check Device
router.post("/check-device", authController.checkDevice);

// Step 2: Send OTP
router.post("/send-otp", authController.sendOtp);

// Step 3: Verify OTP
router.post("/verify-otp", authController.verifyOtp);

// Step 4: Register User
router.post("/register", authController.registerUser);

// Step 5: Login
router.post("/login", authController.login);

// --------------------- EXPORT ---------------------
module.exports = router;
