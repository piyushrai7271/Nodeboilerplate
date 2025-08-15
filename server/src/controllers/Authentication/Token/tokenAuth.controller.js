import UserToken from "../../../models/Authentication/Token/tokeAuth.model.js";
import { cloudinary } from "../../../config/cloudinary.js";
import sendOtpVerifyEmail from "../../../utilles/Token/token.verifyEmail.js";


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

    // 1️⃣ Validate required fields
    if (!fullName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, mobile number, and password are required",
      });
    }

    // 2️⃣ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3️⃣ Validate mobile number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(422).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // 4️⃣ Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(422).json({
        success: false,
        message:
          "Password must be at least 8 chars long, include uppercase, lowercase, number, and special character",
      });
    }

    // 5️⃣ Check for existing email and mobileNumber
    const existingUser = await UserToken.findOne({
      isDeleted: false,
      $or: [{ email }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "User already exists with this email"
            : "User already exists with this mobile number",
      });
    }

    // 6️⃣ Create and save user
    const user = new UserToken({ fullName, email, mobileNumber, password });
    await user.save();

    // 7️⃣ Send OTP email
    const otpResult = await sendOtpVerifyEmail(user);
    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: "User created but failed to send OTP",
      });
    }

    // 8️⃣ Generate OTP token
    const otpToken = user.generateOtpToken();
    if (!otpToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate OTP token",
      });
    }

    // 9️⃣ Success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent to email.",
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
    console.error("Error in register:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const verifyOtp = async (req, res) => {
  try {
    // 1️⃣ Validate input
    const { otp } = req.body;
    const userId = req.userId;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user information",
      });
    }

    // 2️⃣ Find user & validate OTP existence
    const user = await UserToken.findById(userId);
    if (!user || !user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP request",
      });
    }

    // 3️⃣ Check OTP expiration
    if (Date.now() > new Date(user.otpExpiresAt).getTime()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // 4️⃣ Verify OTP correctness
    const isOtpCorrect = await user.isOtpCorrect(otp);
    if (!isOtpCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 5️⃣ Mark user as verified & clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // 6️⃣ Send success response
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const resendOtp = async (req, res) => {
  try {
    // 1️⃣ Get user from request
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // 2️⃣ Check if user already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // 3️⃣ Send OTP email
    const response = await sendOtpVerifyEmail(user);

    // 4️⃣ Check email sending result
    if (response.success) {
      return res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again later",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const login = async (req, res) => {
  try {
    // 1️⃣ Validate input
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await UserToken.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Check email verification
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // 4️⃣ Verify password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 5️⃣ Generate access & refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    // 6️⃣ Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // 7️⃣ Remove sensitive data
    const loggedInUser = await UserToken.findById(user._id).select(
      "-password -refreshToken -otp -otpExpiresAt"
    );

    // 8️⃣ Cookie options
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // 9️⃣ Send success response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Logged in successfully",
        accessToken,
        user: loggedInUser,
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const changePassword = async (req, res) => {
  try {
    // 1️⃣ Validate input presence
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2️⃣ Get user from request
    const user = await UserToken.findById(req.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // 3️⃣ Check verification status
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "You must verify your email before changing password",
      });
    }

    // 4️⃣ Validate current password
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 5️⃣ Validate new password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    }

    // 6️⃣ Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // 7️⃣ Update password
    user.password = newPassword;
    await user.save();

    // 8️⃣ Send success response
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
    // 1️⃣ Extract request body fields & uploaded file
    const {
      profileImage, // optional: direct URL
      address,
      gender,
      fathersName,
      mothersName,
      dob,
      heighestQualification,
    } = req.body;
    const uploadedFile = req.file; // from multer (Cloudinary)

    // 2️⃣ Validate required fields
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
        message: `${missingField} is required`,
      });
    }

    // 3️⃣ Get userId from authentication middleware
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user credentials",
      });
    }

    // 4️⃣ Find user in database
    const user = await UserToken.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 5️⃣ Determine final profile image URL
    let finalProfileImageUrl = user.profileImage; // keep existing if nothing new
    if (uploadedFile?.path) {
      finalProfileImageUrl = uploadedFile.path; // Cloudinary URL
    } else if (profileImage && profileImage.startsWith("http")) {
      finalProfileImageUrl = profileImage; // valid direct URL
    }

    // ✅ TODO: 🛠 Improve DOB handling
    // Accept multiple date formats (DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY)
    // Normalize and store in ISO format before saving to MongoDB


    // 6️⃣ Update user profile details
    user.profileImage = finalProfileImageUrl;
    user.address = address;
    user.gender = gender;
    user.fathersName = fathersName;
    user.mothersName = mothersName;
    user.dob = dob;
    user.heighestQualification = heighestQualification;

    await user.save();
    
    // 7️⃣ Send success response
    return res.status(200).json({
      success: true,
      message: "Profile details updated successfully",
      data: {
        profileImage: user.profileImage,
        address: user.address,
        gender: user.gender,
        fathersName: user.fathersName,
        mothersName: user.mothersName,
        dob: user.dob,
        heighestQualification: user.heighestQualification,
      },
    });
  } catch (error) {
    console.error("Error in addProfileDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const updateUserDetails = async (req, res) => {
  try {
    // 1️⃣ Extract request body & uploaded file
    const {
      fullName,
      email,
      mobileNumber,
      profileImage, // optional direct URL
      address,
      gender,
      fathersName,
      mothersName,
      dob,
      heighestQualification,
    } = req.body;
    const uploadedFile = req.file; // multer-cloudinary uploaded file

    // 2️⃣ Get userId from authentication middleware
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user credentials",
      });
    }

    // 3️⃣ Fetch user & check duplicates in one go
    const [user, duplicateUser] = await Promise.all([
      UserToken.findById(userId),
      UserToken.findOne({
        _id: { $ne: userId },
        $or: [
          email ? { email } : null,
          mobileNumber ? { mobileNumber } : null,
        ].filter(Boolean),
        isDeleted: false,
      }),
    ]);

    // 4️⃣ Handle missing user
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 5️⃣ Handle duplicate email or mobileNumber
    if (duplicateUser) {
      if (email && duplicateUser.email === email) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered with another account",
        });
      }
      if (mobileNumber && duplicateUser.mobileNumber === mobileNumber) {
        return res.status(409).json({
          success: false,
          message: "Mobile number is already registered with another account",
        });
      }
    }

    // 6️⃣ Update profile image
    if (uploadedFile?.path) {
      user.profileImage = uploadedFile.path; // Cloudinary URL
    } else if (profileImage && profileImage.startsWith("http")) {
      user.profileImage = profileImage; // direct URL
    }

    // 7️⃣ Update other provided fields (only if given)
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (address) user.address = address;
    if (gender) user.gender = gender;
    if (fathersName) user.fathersName = fathersName;
    if (mothersName) user.mothersName = mothersName;
    if (dob) user.dob = dob;
    if (heighestQualification)
      user.heighestQualification = heighestQualification;

    // 8️⃣ Save updated user
    await user.save();

    // 9️⃣ Respond with sanitized data
    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      data: {
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
      },
    });
  } catch (error) {
    console.error("Error in updateUserDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:error.message,
    });
  }
};
const getUserDetail = async (req, res) => {
  try {
    // 1️⃣ Extract userId from authentication middleware
    const userId = req.userId;

    // 2️⃣ Validate that userId is present
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID is missing from request",
      });
    }

    // 3️⃣ Fetch user details (exclude sensitive fields for security)
    const user = await UserToken.findById(userId)
      .select("-password -otp -refreshToken -otpExpiresAt")
      .lean();

    // 4️⃣ Handle case: User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided ID",
      });
    }

    // 5️⃣ Block soft-deleted accounts from accessing details
    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deleted. Please contact support to restore access.",
      });
    }

    // 6️⃣ Respond with sanitized user details
    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    // 7️⃣ Log error and return generic message
    console.error("Error in getUserDetail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getAllUserDetails = async (req, res) => {
  try {
    // 1️⃣ Pagination params (defaults: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2️⃣ Total user count excluding soft-deleted accounts
    const totalUsers = await UserToken.countDocuments({ isDeleted: false });

    // 3️⃣ Fetch paginated users (excluding sensitive fields & deleted users)
    const users = await UserToken.find({ isDeleted: false })
      .select("-password -otp -refreshToken -otpExpiresAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // newest first
      .lean();

    // 4️⃣ Respond with paginated data
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
    // 5️⃣ Log error and return generic message
    console.error("Error while fetching all users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const softDeleteUser = async (req, res) => {
  try {
    // 1️⃣ Extract userId from authentication middleware
    const userId = req.userId;

    // 2️⃣ Validate that userId is present
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID is missing from request",
      });
    }

    // 3️⃣ Find user in database
    const existingUser = await UserToken.findById(userId);

    // 4️⃣ Handle case: User not found
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided ID",
      });
    }

    // 5️⃣ Prevent re-deleting an already soft-deleted account
    if (existingUser.isDeleted) {
      return res.status(409).json({
        success: false,
        message: "User account is already deleted",
      });
    }

    // 6️⃣ Perform soft delete + set deletion timestamp
    existingUser.isDeleted = true;
    existingUser.deletedAt = new Date(); // 🕒 Track deletion time
    await existingUser.save();

    // 7️⃣ Respond with success
    return res.status(200).json({
      success: true,
      message: "User account soft-deleted successfully",
      deletedAt: existingUser.deletedAt, // Optional: return timestamp
    });
  } catch (error) {
    // 8️⃣ Log error and return generic internal error
    console.error("Error in softDeleteUser:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const hardDeleteUser = async (req, res) => {
  try {
    // 1️⃣ Get userId (self-deletion from token; admin deletion can use req.params.id)
    const userId = req.userId || req.params.id;

    // 2️⃣ Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    // 3️⃣ Find user in DB
    const user = await UserToken.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided ID",
      });
    }

    // 4️⃣ If Cloudinary profile image exists, try to delete it
    if (user.profileImage) {
      try {
        const publicIdMatch = user.profileImage.match(/\/([^/]+)\.[a-zA-Z]+$/);
        if (publicIdMatch?.[1]) {
          const publicId = `CTRD/${publicIdMatch[1]}`;
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
        }
      } catch (err) {
        console.error(
          "⚠️ Failed to delete image from Cloudinary:",
          err.message
        );
        // Continue deletion process even if image removal fails
      }
    }

    // 5️⃣ Permanently delete user from DB
    await UserToken.findByIdAndDelete(userId);

    // 6️⃣ Return success response
    return res.status(200).json({
      success: true,
      message: "User permanently deleted successfully",
    });
  } catch (error) {
    // 7️⃣ Log and return error
    console.error("❌ Error while hard deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const logOut = async (req, res) => {
  try {
    // 1️⃣ Remove refreshToken from DB if user is logged in
    if (req.user?._id) {
      await UserToken.findByIdAndUpdate(req.user._id, { refreshToken: "" });
    }

    // 2️⃣ Clear authentication cookies
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

    // 3️⃣ Respond with success message
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    // 4️⃣ Log and return error
    console.error("❌ Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  register,
  verifyOtp,
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
