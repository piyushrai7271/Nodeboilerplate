const express = require('express');
const {upload} = require('../../../config/cloudinary');
const {
  register,
  login,
  verifyOtp,
  resendOtp,
  logout,
  getUserById,
}  = require('../../../controllers/Authentication/Otp/userOtpAuth.controller');
const router = express.Router();

router.post('/register',upload.single('profileImage'), register);
router.post('/login',login);
router.post('/verify-otp', verifyOtp);
router.post("/resendOtp",resendOtp);
router.post("/logout",logout);
router.get("/getUserById/:userId",getUserById)




module.exports = router