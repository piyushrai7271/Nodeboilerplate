import express from "express";
import { upload } from "../../../config/cloudinary.js";
import handleUploadError from "../../../middleware/Token/uploadError.middleware.js";
import {
  userValidateOtpToken as otpValidation,
  userValidateToken as tokenValidation,
} from "../../../middleware/Token/tokenAuth.middleware.js";
import {
  loginLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
} from "../../../middleware/Token/rateLimiter.js";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  changePassword,
  forgetPassword,
  resetPassword,
  addProfileDetails,
  updateUserDetails,
  getUserDetail,
  getAllUserDetails,
  softDeleteUser,
  hardDeleteUser,
  logOut,
} from "../../../controllers/Authentication/Token/tokenAuth.controller.js";

const router = express.Router();


// 1️⃣ Registration & OTP Verification
router.post("/register", register); 
router.post("/verfy-Otp", otpVerifyLimiter, otpValidation, verifyOtp); 
router.post("/resend-Otp", otpResendLimiter, otpValidation, resendOtp); 

// 2️⃣ Login & Password Management
router.post("/login", loginLimiter, login); 
router.post("/change-password", tokenValidation, changePassword);
router.post("/forget-password",forgetPassword);
router.post("/reset-password/:token", resetPassword); 

// 3️⃣ Profile Management
router.post(
  "/add-profile-details",
  tokenValidation,
  handleUploadError(upload.single("profileImage")), 
  addProfileDetails
);
router.put(
  "/update-user-detaile",
  tokenValidation,
  handleUploadError(upload.single("profileImage")),
  updateUserDetails
);

// 4️⃣ User Data Retrieval
router.get("/get-user-detail", tokenValidation, getUserDetail); 
router.get("/get-all-user-details", tokenValidation, getAllUserDetails); 

// 5️⃣ Account Deletion
router.delete("/soft-delete-user", tokenValidation, softDeleteUser); 
router.delete("/hard-delete-user", tokenValidation, hardDeleteUser); 

// 6️⃣ Logout
router.post("/logout", tokenValidation, logOut); 

export default router;
