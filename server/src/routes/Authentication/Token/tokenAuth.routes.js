import express from "express"
import {
    register,
    verfyOtp,
    login,
    changePassword,
    addProfileDetails,
    updateUserDetails,
    getUserDetail,
    getAllUserDetails,
    softDaleteUser,
    hardDeleteUser,
    logOut
} from "../../../controllers/Authentication/Token/tokenAuth.controller.js";
const router = express.Router();


//Routes...
router.post("/register",register);
router.post("/verfy-Otp", verfyOtp);
router.post("/login",login);
router.post("/change-password",changePassword);
router.post("/add-profile-details",addProfileDetails);
router.put("/update-user-detaile",updateUserDetails);
router.get("/get-user-detail",getUserDetail);
router.get("/get-all-user-details",getAllUserDetails);
router.delete("/soft-delete-user",softDaleteUser);
router.delete("/hard-delete-user",hardDeleteUser);
router.post("/logout",logOut);

export default router;