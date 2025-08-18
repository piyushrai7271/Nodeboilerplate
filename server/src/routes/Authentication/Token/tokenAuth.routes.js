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

/**
 * 📌 Authentication & User Management Routes
 * ------------------------------------------
 * Each route is secured with appropriate middleware:
 *  - tokenValidation: Verifies user’s auth token.
 *  - otpValidation: Validates OTP token for OTP-related actions.
 *  - Rate Limiters: Prevent brute force or spam (per route).
 *  - upload.single("profileImage"): Handles profile image upload where required.and handled error handling
 */

// 1️⃣ Registration & OTP Verification
router.post("/register", register); // New user registration
router.post("/verfy-Otp", otpVerifyLimiter, otpValidation, verifyOtp); // OTP verification for account activation
router.post("/resend-Otp", otpResendLimiter, otpValidation, resendOtp); // Resend OTP

// 2️⃣ Login & Password Management
router.post("/login", loginLimiter, login); // Login with credentials
router.post("/change-password", tokenValidation, changePassword); // Change password (authenticated)
router.post("/forget-password",forgetPassword); // Request password reset link
router.post("/reset-password", otpValidation, resetPassword); // Reset password using OTP

// 3️⃣ Profile Management
router.post(
  "/add-profile-details",
  tokenValidation,
  handleUploadError(upload.single("profileImage")), // Handle single profile image upload with error handling
  addProfileDetails
);
router.put(
  "/update-user-detaile",
  tokenValidation,
  handleUploadError(upload.single("profileImage")),// Handle single profile image upload with error handling
  updateUserDetails
);

// 4️⃣ User Data Retrieval
router.get("/get-user-detail", tokenValidation, getUserDetail); // Get logged-in user details
router.get("/get-all-user-details", tokenValidation, getAllUserDetails); // Get all users (paginated)

// 5️⃣ Account Deletion
router.delete("/soft-delete-user", tokenValidation, softDeleteUser); // Mark user as deleted
router.delete("/hard-delete-user", tokenValidation, hardDeleteUser); // Permanently delete user

// 6️⃣ Logout
router.post("/logout", tokenValidation, logOut); // Logout and clear tokens

export default router;
