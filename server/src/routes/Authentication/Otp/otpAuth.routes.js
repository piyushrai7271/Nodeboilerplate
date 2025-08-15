import express from "express";
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
    forgetPassword,
    resetPassword,
    logOut
}  from "../../../controllers/Authentication/Otp/otpAuth.controller.js";
const router = express.Router();
export default router;