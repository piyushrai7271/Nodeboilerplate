import express from "express";
import { upload } from "../../../config/cloudinary.js";
import {
  userValidateOtpToken as otpAuth,   // 1️⃣ Short-lived OTP token middleware
  userValidateAccessToken as Auth,    // 2️⃣ Access token middleware (post-login)
} from "../../../middleware/Otp/otpAuth.middleware.js";

import {
  login,
  verifyOtp,
  resendOtp,
  addUserProfileDetail,
  updateUserProfileDetail,
  getUserProfileDetail,
  getAllUserDetails,
  softDeleteUser,
  hardDeleteUser,
  logOut,
} from "../../../controllers/Authentication/Otp/otpAuth.controller.js";

const router = express.Router();


// 1️⃣ Login with email/mobile → Send OTP
router.post("/login", login);

// 2️⃣ Verify OTP (OTP token required)
router.post("/verify-otp", otpAuth, verifyOtp);

// 3️⃣ Resend OTP (OTP token required)
router.post("/resend-otp", otpAuth, resendOtp);

// 4️⃣ Add new user profile details (with optional profile image)
router.post("/add-user-profile", Auth, upload.single("profileImage"), addUserProfileDetail);

// 5️⃣ Update existing user profile details (with optional profile image)
router.put("/update-user-profile", Auth, upload.single("profileImage"), updateUserProfileDetail);

// 6️⃣ Get current user's profile details
router.get("/get-user-profile", Auth, getUserProfileDetail);

// 7️⃣ Get all users (Admin/Authorized access)
router.get("/get-all-users", Auth, getAllUserDetails);

// 8️⃣ Soft delete user → Mark as deleted but keep data
router.delete("/soft-delete-user", Auth, softDeleteUser);

// 9️⃣ Hard delete user → Permanently remove user data
router.delete("/hard-delete-user", Auth, hardDeleteUser);

// 🔟 Logout user → Clear session tokens
router.post("/logout", Auth, logOut);

export default router;
