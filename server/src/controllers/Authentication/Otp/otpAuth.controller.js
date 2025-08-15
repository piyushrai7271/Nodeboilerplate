import UserOtp from "../../../models/Authentication/Otp/otpAuth.model.js";
import otpVerifyEmail from "../../../utilles/Otp/otp.verifyEmail.js";


const generateAccessAndRefreshTokens = async(userId) =>{
    try {
    const user = await UserOtp.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Token generation failed");
  }
}
const login = async(req,res) =>{
    try {
        const {email,mobileNumber} = req.body;

        if(!email && !mobileNumber){
            return res.status(400).json({
                success: false,
                message: "Please provide either an email or a mobile number to receive OTP"
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}
const verifyOtp = async(req,res) =>{}
const resendOtp = async(req,res) =>{}
const addUserProfileDetail = async(req,res) =>{}
const updateUserProfileDetail = async(req,res) =>{}
const getUserProfileDetail = async(req,res) =>{}
const getAllUserDetails = async(req,res) =>{}
const softDeleteUser = async(req,res) =>{}
const hardDeleteUser = async(req,res) =>{}
const forgetPassword = async(req,res) =>{}
const resetPassword = async(req,res) =>{}
const logOut = async (req,res) =>{}

export {
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
}