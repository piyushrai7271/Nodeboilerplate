import express from "express";
import {
  userValidateOtpToken as otpValidation,
  userValidateToken as tokenValidation,
} from "../../../middleware/Token/tokenAuth.middleware.js";
import {
  register,
  verfyOtp,
  resendOtp,
  login,
  changePassword,
  addProfileDetails,
  updateUserDetails,
  getUserDetail,
  getAllUserDetails,
  softDaleteUser,
  hardDeleteUser,
  logOut,
} from "../../../controllers/Authentication/Token/tokenAuth.controller.js";
const router = express.Router();

//Routes...
router.post("/register", register);
router.post("/verfy-Otp",otpValidation, verfyOtp);
router.post("/resend-Otp",otpValidation, resendOtp);
router.post("/login", login);
router.post("/change-password",tokenValidation, changePassword);
router.post("/add-profile-details",tokenValidation,upload.single("profileImage"), addProfileDetails);
router.put("/update-user-detaile",tokenValidation, updateUserDetails);
router.get("/get-user-detail",tokenValidation, getUserDetail);
router.get("/get-all-user-details",tokenValidation, getAllUserDetails);
router.delete("/soft-delete-user",tokenValidation, softDaleteUser);
router.delete("/hard-delete-user",tokenValidation, hardDeleteUser);
router.post("/logout",tokenValidation, logOut);

export default router;
