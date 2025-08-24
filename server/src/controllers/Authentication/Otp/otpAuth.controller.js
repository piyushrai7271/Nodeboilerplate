import UserOtp from "../../../models/Authentication/Otp/otpAuth.model.js";
import otpVerifyEmail from "../../../utilles/Otp/otp.verifyEmail.js";
import otpVerifySms from "../../../utilles/Otp/otp.verifySms.js";
import {cloudinary} from "../../../config/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
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
};
const login = async (req, res) => {
  try {
    const { email, mobileNumber } = req.body;

    // 1️⃣ Validate required fields
    if (!email && !mobileNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide either an email or a mobile number to receive OTP",
      });
    }

    // 2️⃣ Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(422).json({
          success: false,
          message: "Invalid email format",
        });
      }
    }

    // 3️⃣ Validate mobile number format if provided
    if (mobileNumber) {
      const phoneRegex = /^[6-9]\d{9}$/; // ✅ Indian format: starts with 6-9, total 10 digits
      if (!phoneRegex.test(mobileNumber)) {
        return res.status(422).json({
          success: false,
          message: "Mobile number must be a valid 10-digit Indian number",
        });
      }
    }

    // 4️⃣ Build dynamic filter
    const filter = { isDeleted: false };
    if (email) filter.email = email;
    if (mobileNumber) filter.mobileNumber = mobileNumber;

    // 5️⃣ Find or create user
    let user = await UserOtp.findOne(filter);

    if (!user) {
      user = new UserOtp({ email, mobileNumber });
    }

    // 6️⃣ Generate & send OTP
    let otpSendResult;
    if (email) {
      otpSendResult = await otpVerifyEmail(user);
    } else if (mobileNumber) {
      otpSendResult = await otpVerifySms(user);
    }

    if (!otpSendResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later.",
      });
    }

    // 7️⃣ Save user after OTP update
    await user.save();

    // 8️⃣ Generate OTP session token
    const otpToken = user.generateOtpToken();
    if (!otpToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate OTP session token",
      });
    }

    // 9️⃣ Send response
    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to your ${
        email ? "email" : "mobile number"
      }`,
      otpToken, // Client must use this for verification
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
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.userId; // ✅ Extracted from otpToken in middleware

    // 1️⃣ Validate OTP presence
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required for verification",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User identifier missing. Cannot verify OTP",
      });
    }

    // 2️⃣ Find the user by ID
    const user = await UserOtp.findOne({
      _id: userId,
      isDeleted: false,
    }).select("+otp +otpExpiresAt");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please request OTP again.",
      });
    }

    // 3️⃣ Verify OTP using model method (handles expiration internally)
    const isOtpValid = await user.isOtpCorrect(otp);
    if (!isOtpValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // 4️⃣ OTP verified → clear OTP
    user.otp = null;
    user.otpExpiresAt = null;

    // 5️⃣ Generate Access & Refresh Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // 6️⃣ Save refreshToken in DB (skip validation)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // 7️⃣ Set cookies (secure & httpOnly)
    const options = {
      httpOnly: true,
      secure: true, // ✅ Ensure HTTPS in production
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // 8️⃣ Respond with success, tokens in cookies & user info
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "OTP verified successfully. Logged in.",
        data: {
          id: user._id,
          email: user.email,
          mobileNumber: user.mobileNumber,
        },
      });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const resendOtp = async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extracted from otpToken in middleware

    // 1️⃣ Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User identifier missing. Cannot resend OTP.",
      });
    }

    // 2️⃣ Find the user
    const user = await UserOtp.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please request OTP again through login.",
      });
    }

    // 3️⃣ Clear old OTP and expiry
    user.otp = null;
    user.otpExpiresAt = null;

    // 4️⃣ Generate and send new OTP
    let otpSendResult;
    if (user.email) {
      otpSendResult = await otpVerifyEmail(user);
    } else if (user.mobileNumber) {
      otpSendResult = await otpVerifySms(user);
    } else {
      return res.status(400).json({
        success: false,
        message:
          "User does not have a valid email or mobile number for OTP delivery.",
      });
    }

    if (!otpSendResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later.",
      });
    }

    // 5️⃣ Save user after OTP update
    await user.save();

    // 6️⃣ Generate a fresh OTP token
    const otpToken = user.generateOtpToken();
    if (!otpToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate new OTP token.",
      });
    }

    // 7️⃣ Respond with success
    return res.status(200).json({
      success: true,
      message: `OTP resent successfully to your ${
        user.email ? "email" : "mobile number"
      }.`,
      otpToken, // ✅ New token for next verifyOtp call
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const addUserProfileDetail = async (req, res) => {
  try {
    const { fullName, gender, address, email, mobileNumber, profileImage } = req.body;
    const uploadedImage = req.file; // For uploaded image (Cloudinary via Multer)

    // ✅ Validate required fields (fullName, gender, address are mandatory)
    if (!fullName || !gender || !address) {
      return res.status(400).json({
        success: false,
        message: "Please provide fullName, gender, and address.",
      });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found.",
      });
    }

    // ✅ Find user by ID
    const user = await UserOtp.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ✅ Determine final profile image URL
    let profileImageUrl = user.profileImage; // Keep existing if nothing new
    if (uploadedImage?.path) {
      profileImageUrl = uploadedImage.path; // From Cloudinary (via Multer)
    } else if (profileImage && profileImage.startsWith("http")) {
      profileImageUrl = profileImage; // From frontend body (URL)
    }

    // ✅ Update required fields
    user.fullName = fullName;
    user.gender = gender;
    user.address = address;
    user.profileImage = profileImageUrl;

    // ✅ Handle email & mobileNumber logic
    if (!user.email && email) {
      user.email = email;
    }
    if (!user.mobileNumber && mobileNumber) {
      user.mobileNumber = mobileNumber;
    }

    // ✅ Save updated user profile
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "User profile details added successfully.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        address: user.address,
        gender: user.gender,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Add user profile detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const updateUserProfileDetail = async (req, res) => {
  try {
    const { fullName, gender, address, email, mobileNumber, profileImage } = req.body;
    const uploadedImage = req.file; // For uploaded image (Cloudinary via Multer)
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found.",
      });
    }

    // ✅ Find user by ID
    const user = await UserOtp.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ✅ Update fields if provided (partial update allowed)
    if (fullName) user.fullName = fullName;
    if (gender) user.gender = gender;
    if (address) user.address = address;

    // ✅ Handle email & mobileNumber update logic
    if (email && email !== user.email) {
      user.email = email;
    }
    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      user.mobileNumber = mobileNumber;
    }

    // ✅ Handle profile image update
    if (uploadedImage?.path) {
      user.profileImage = uploadedImage.path; // Cloudinary URL
    } else if (profileImage && profileImage.startsWith("http")) {
      user.profileImage = profileImage; // Direct URL
    }

    // ✅ Save updated user
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        address: user.address,
        gender: user.gender,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Update user profile detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getUserProfileDetail = async (req, res) => {
  try {
    const userId = req.userId;

    // 1️⃣ Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found.",
      });
    }

    // 2️⃣ Find user by ID (exclude sensitive fields, ensure isDeleted = false)
    const user = await UserOtp.findOne({ _id: userId, isDeleted: false })
                              .select("fullName email mobileNumber gender address profileImage")
                              .lean();

    // 3️⃣ Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 4️⃣ Respond with user profile details
    return res.status(200).json({
      success: true,
      message: "User profile details fetched successfully.",
      data:{
         id:user._id,
         fullName:user.fullName,
         email:user.email,
         mobileNumber:user.mobileNumber,
         gender:user.gender,
         address:user.address,
         profileImage:user.profileImage
      },
    });
  } catch (error) {
    console.error("Error fetching profile detail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getAllUserDetails = async (req, res) => {
  try {
    // 1️⃣ Get pagination params
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers.",
      });
    }

    // 2️⃣ Build search query (case-insensitive)
    const searchQuery = {
      isDeleted: false,
      ...(search
        ? {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { mobileNumber: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    // 3️⃣ Count total documents for pagination
    const totalUsers = await UserOtp.countDocuments(searchQuery);

    // 4️⃣ Fetch paginated users (include createdAt & updatedAt)
    const users = await UserOtp.find(searchQuery)
      .select("fullName email mobileNumber gender address profileImage createdAt updatedAt")
      .sort({ createdAt: -1 }) // Latest first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 5️⃣ Transform data: change _id → id
    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      gender: user.gender,
      address: user.address,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    // 6️⃣ Return response
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      pagination: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        limit,
      },
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching all user details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const softDeleteUser = async (req, res) => {
  try {
    const userId = req.userId; // ✅ From middleware

    // 1️⃣ Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found.",
      });
    }

    // 2️⃣ Find user
    const user = await UserOtp.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted.",
      });
    }

    // 3️⃣ Mark user as deleted
    user.isDeleted = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "User account soft deleted successfully.",
    });
  } catch (error) {
    console.error("Soft delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const hardDeleteUser = async (req, res) => {
  try {
    const userId = req.userId; // ✅ From middleware

    // 1️⃣ Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found.",
      });
    }

    // 2️⃣ Find user
    const user = await UserOtp.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 3️⃣ Remove profile image from Cloudinary if exists
    if (user.profileImage) {
      try {
        // Extract public_id from profileImage URL
        const publicId = user.profileImage.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary image deleted: ${publicId}`);
      } catch (cloudError) {
        console.error("Error deleting image from Cloudinary:", cloudError.message);
      }
    }

    // 4️⃣ Permanently delete user
    await UserOtp.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User account permanently deleted successfully.",
    });
  } catch (error) {
    console.error("Hard delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const logOut = async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extracted from accessToken middleware

    // 1️⃣ Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found.",
      });
    }

    // 2️⃣ Find the user
    const user = await UserOtp.findOne({
      _id: userId,
      isDeleted: false,
    }).select("+refreshToken");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or already logged out.",
      });
    }

    // 3️⃣ Clear refreshToken in DB
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    // 4️⃣ Clear cookies
    const options = {
      httpOnly: true,
      secure: true, // ✅ Ensure HTTPS in production
      sameSite: "None",
    };

    // 5️⃣ Respond with success
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        success: true,
        message: "Logged out successfully.",
      });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

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
  logOut,
};
