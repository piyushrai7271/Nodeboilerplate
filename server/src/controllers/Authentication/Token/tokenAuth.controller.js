import mongoose from "mongoose";
import UserToken from "../../../models/Authentication/Token/tokeAuth.model.js";
import {cloudinary} from "../../../config/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await UserToken.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Token generation failed");
  }
};
const register = async (req, res) => {
  try {
    const { fullName, email, mobileNumber, password } = req.body;

    //validating input
    if (!fullName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "For registering user all feilds are required",
      });
    }
    //validate email formate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    //validate mobileNumber formate
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }

    //check for strong password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    //check for unique email
    const emailExist = await UserToken.find({ email });
    if (emailExist) {
      return res.status(401).json({
        success: false,
        message: "User already exist with this email",
      });
    }
    //create user for register
    const user = new UserToken({
      fullName,
      email,
      mobileNumber,
      password,
    });

    // save user for register
    await user.save();

    // send otp on provided email
    const otpResult = await sendOtpVerifyEmail(user);
    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: "User created but failed to send OTP",
      });
    }

    //Generate short liver OTP
    const otpToken = user.generateOtpToken();
    if (!otpToken) {
      return res.status(400).json({
        success: false,
        message: "Otp token doesn't recive",
      });
    }

    //return successfull message
    return res.status(201).json({
      success: true,
      message: "User registered successfully !!",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
      },
      otpToken,
    });
  } catch (error) {
    console.error("Error in register :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const verfyOtp = async (req, res) => {
  try {
    const { otp } = req.otp;
    const userId = req.userId;

    //validate comming input
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Otp is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found in request",
      });
    }
    //find user with user id
    const user = await UserToken.findById(userId);
    if (!user || !user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No Otp found or user already verified",
      });
    }

    //check expiration
    const isExpired = Date.now() > new Date(user.otpExpiresAt).getTime();
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "Otp has expired. please request a new one.",
      });
    }

    //verify Otp
    const isOtpCorrect = await user.isOtpCorrect(otp);
    if (!isOtpCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP !!",
      });
    }
    // mark user verified and clear otp
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    //return successful message
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. you can log in",
    });
  } catch (error) {
    console.error("Error in verify Otp :", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server error !!",
    });
  }
};
const resendOtp = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified. No need to resend OTP.",
      });
    }

    const response = await sendOtpVerifyEmail(user);

    if (response.success) {
      return res.status(200).json({
        success: true,
        message: "OTP resent successfully !!",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP please try again",
      });
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required for login.",
      });
    }
    //find user with email
    const user = await UserToken.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email or Password is incorrect. please register first.",
      });
    }
    //check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your email is not verified. please verify before logging In.",
      });
    }
    //compare password with hased
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }
    //generate access and refresh Token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    // Store refreshToken in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    //Sanitize user object
    const loggedInUser = await UserToken.findById(user._id).select(
      "-password -refreshToken -otp -otpExpiresAt"
    );

    // set cookies
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    //send response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "User logged in successfully !!",
        accessToken,
        user: loggedInUser,
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input presence
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Get user from request
    const user = await UserToken.findById(req.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "You must verify your email before changing password",
      });
    }

    // Check current password
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Validate new password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    // Check new vs confirm
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // Update password (hashed via pre-save hook)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const addProfileDetails = async (req, res) => {
  try {
    const {
      profileImage, // only direct URL now
      address,
      gender,
      fathersName,
      mothersName,
      dob,
      heighestQualification,
    } = req.body;

    const uploadedFile = req.file; // multer file from Cloudinary

    // Validation
    const missingField = !(profileImage || uploadedFile)
      ? "profileImage"
      : !address
      ? "address"
      : !gender
      ? "gender"
      : !fathersName
      ? "fathersName"
      : !mothersName
      ? "mothersName"
      : !dob
      ? "dob"
      : !heighestQualification
      ? "heighestQualification"
      : null;

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `${missingField} is missing !!`,
      });
    }

    // Get userId from middleware auth
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User is unauthorized, userId not found",
      });
    }

    // Find user
    const user = await UserToken.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with given ID",
      });
    }

    // Set profile image from either uploaded file or direct URL
    let finalProfileImageUrl = user.profileImage;
    if (uploadedFile?.path) {
      finalProfileImageUrl = uploadedFile.path; // multer-cloudinary URL
    } else if (profileImage && profileImage.startsWith("http")) {
      finalProfileImageUrl = profileImage; // direct URL
    }

    // Update user
    user.profileImage = finalProfileImageUrl;
    user.address = address;
    user.gender = gender;
    user.fathersName = fathersName;
    user.mothersName = mothersName;
    user.dob = dob;
    user.heighestQualification = heighestQualification;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile details updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error while Adding profile detail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server Error !!",
      error: error.message,
    });
  }
};
const updateUserDetails = async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobileNumber,
      profileImage, // only for direct URLs
      address,
      gender,
      fathersName,
      mothersName,
      dob,
      heighestQualification,
    } = req.body;

    const uploadedFile = req.file; // multer-cloudinary uploaded file

    // Check userId from middleware
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized user without user Id",
      });
    }

    // Find user
    const user = await UserToken.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided Id",
      });
    }

    // Handle profileImage update
    if (uploadedFile?.path) {
      user.profileImage = uploadedFile.path; // multer-cloudinary URL
    } else if (profileImage && profileImage.startsWith("http")) {
      user.profileImage = profileImage; // direct URL
    }

    // Update only provided fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (address) user.address = address;
    if (gender) user.gender = gender;
    if (fathersName) user.fathersName = fathersName;
    if (mothersName) user.mothersName = mothersName;
    if (dob) user.dob = dob;
    if (heighestQualification) user.heighestQualification = heighestQualification;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      data: user,
    });

  } catch (error) {
    console.error("Error while updating user data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
      error: error.message,
    });
  }
};
const getUserDetail = async (req, res) => {
  try {
    const userId = req.userId;

    // ✅ Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: userId is missing",
      });
    }

    // ✅ Find user (no password, lean object for performance)
    const user = await UserToken.findById(userId)
      .select("-password -otp -refreshToken")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Return user details
    return res.status(200).json({
      success: true,
      message: "User detail fetched successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        profileImage: user.profileImage,
        address: user.address,
        gender: user.gender,
        fathersName: user.fathersName,
        mothersName: user.mothersName,
        dob: user.dob,
        heighestQualification: user.heighestQualification,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error while finding user details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getAllUserDetails = async (req, res) => {
  try {
    // ✅ Pagination params (defaults: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Total user count
    const totalUsers = await UserToken.countDocuments({ isDeleted: false });

    // ✅ Fetch paginated users (excluding sensitive fields)
    const users = await UserToken.find({ isDeleted: false })
      .select("-password -otp -refreshToken")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        pageSize: limit,
      },
      data: users,
    });
  } catch (error) {
    console.error("Error while fetching all users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const softDeleteUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    const existingUser = await UserToken.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (existingUser.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "User is already deleted",
      });
    }

    existingUser.isDeleted = true;
    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "User soft deleted successfully",
    });
  } catch (error) {
    console.error("Error while soft deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const hardDeleteUser = async (req, res) => {
  try {
    const userId = req.userId; // for self-deletion; for admin deletion, use req.params.id

    // 🔹 Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    // 🔹 Find user
    const user = await UserToken.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 If user has Cloudinary profile image, delete it
    if (user.profileImage) {
      try {
        // Extract public_id from Cloudinary URL
        const publicIdMatch = user.profileImage.match(/\/([^/]+)\.[a-zA-Z]+$/);
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = `CTRD/${publicIdMatch[1]}`;
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        }
      } catch (err) {
        console.error("⚠️ Failed to delete image from Cloudinary:", err.message);
        // We log the error but still continue with DB deletion
      }
    }

    // 🔹 Delete user from DB
    await UserToken.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User permanently deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error while hard deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const logOut = async (req, res) => {
  try {
    // Optional: Remove refreshToken from user in DB
    if (req.user) {
      await UserToken.findByIdAndUpdate(req.user._id, { refreshToken: "" });
    }

    // Clear cookies
    res
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  register,
  verfyOtp,
  resendOtp,
  login,
  changePassword,
  addProfileDetails,
  updateUserDetails,
  getUserDetail,
  getAllUserDetails,
  softDeleteUser,
  hardDeleteUser,
  logOut,
};
