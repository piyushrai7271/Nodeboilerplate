import express from "express";
import {upload} from "../../../config/cloudinary.js";
import {userValidateOtpToken as otpAuth} from "../../../middleware/Otp/otpAuth.middleware.js";
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

router.post("/login", login);
router.post("/verify-otp", otpAuth, verifyOtp);
router.post("/resend-otp", otpAuth, resendOtp);
router.post("/add-user-profile", otpAuth,upload.single("profileImage"), addUserProfileDetail);
router.put("/update-user-profile", otpAuth,upload.single("profileImage"), updateUserProfileDetail);
router.get("/get-user-profile", otpAuth, getUserProfileDetail);
router.get("/get-all-users", otpAuth, getAllUserDetails);
router.delete("/soft-delete-user", otpAuth, softDeleteUser);
router.delete("/hard-delete-user", otpAuth, hardDeleteUser);
router.post("/logout", otpAuth, logOut);
export default router;
