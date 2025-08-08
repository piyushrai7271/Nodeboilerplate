const User = require("../../../models/Authentication/user.model");
const mongoose = require("mongoose");
const sendOtpMail = require("../../../utilles/sendEmail");

// const register = async (req, res) => {
//   try {
//     const {
//       userName,
//       mobileNumber,
//       fullname,
//       dob,
//       address,
//       email,
//       profileImage,
//       gender,
//     } = req.body;

//     // Validate required fields only
//     if (!userName || !mobileNumber || !email) {
//       return res.status(400).json({
//         success: false,
//         message: "Username and phone number or email are required",
//       });
//     }

//     // Validate mobile number format
//     const isValidmobileNumber = /^[6-9]\d{9}$/.test(mobileNumber);
//     if (!isValidmobileNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid phone number format.",
//       });
//     }

//     // Check if a verified user already exists with this mobile number
//     const existingUser = await User.exists({ mobileNumber, isVerified: true });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists with this mobile number",
//       });
//     }

//     // Generate OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

//     // If a not-verified user exists, update that user's OTP and other fields
//     const notVerifiedUser = await User.findOne({
//       mobileNumber,
//       isVerified: false,
//     });

//     if (notVerifiedUser) {
//       await User.findOneAndUpdate(
//         { mobileNumber },
//         {
//           otp,
//           otpExpiresAt,
//           userName,
//           fullname,
//           dob,
//           address,
//           email,
//           profileImage,
//           gender,
//         }
//       );
//     } else {
//       // Create new user with required and optional fields
//       const newUser = new User({
//         userName,
//         mobileNumber,
//         otp,
//         otpExpiresAt,
//         // Only add optional fields if present
//         ...(fullname && { fullname }),
//         ...(dob && { dob }),
//         ...(address && { address }),
//         ...(email && { email }),
//         ...(profileImage && { profileImage }),
//         ...(gender && { gender }),
//       });
//       await newUser.save();
//     }

//     // Return response (do not send OTP in production!)
//     return res.status(201).json({
//       success: true,
//       message: "Otp sent successfully.",
//       isForRegistration: true,
//       data: { otp, mobileNumber, }
//     });
//   } catch (error) {
//     console.error("Error during registration:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

const register = async (req, res) => {
  try {
    const {
      userName,
      mobileNumber,
      fullname,
      dob,
      address,
      email,
      profileImage,
      gender,
    } = req.body;

    // Validate required fields
    if (!userName || !mobileNumber || !email) {
      return res.status(400).json({
        success: false,
        message: "Username, phone number, and email are required",
      });
    }

    // Validate mobile number format
    const isValidmobileNumber = /^[6-9]\d{9}$/.test(mobileNumber);
    if (!isValidmobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format.",
      });
    }

    // Check for existing user with mobile number, email, or userName (and not soft deleted)
    const duplicateUser = await User.findOne({
      $or: [
        { mobileNumber },
        { email },
        { userName }
      ],
      isDeleted: false
    });

    if (duplicateUser) {
      let duplicateField = '';
      if (duplicateUser.mobileNumber === mobileNumber) duplicateField = 'mobile number';
      else if (duplicateUser.email === email) duplicateField = 'email';
      else duplicateField = 'username';
      return res.status(400).json({
        success: false,
        message: `User already exists with this ${duplicateField}`,
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // If a not-verified user exists (with same mobile/email/username but marked as deleted), revive and update
    const notVerifiedUser = await User.findOne({
      $or: [
        { mobileNumber },
        { email },
        { userName }
      ],
      isVerified: false,
      isDeleted: true
    });

    let userId;
    if (notVerifiedUser) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: notVerifiedUser._id },
        {
          otp,
          otpExpiresAt,
          userName,
          fullname,
          dob,
          address,
          email,
          profileImage,
          gender,
          isDeleted: false,
          deletedAt: null,
        },
        { new: true }
      );
      userId = updatedUser._id;
    } else {
      // Create new user with provided fields
      const newUser = new User({
        userName,
        mobileNumber,
        email,
        otp,
        otpExpiresAt,
        ...(fullname && { fullname }),
        ...(dob && { dob }),
        ...(address && { address }),
        ...(profileImage && { profileImage }),
        ...(gender && { gender }),
      });
      await newUser.save();
      userId = newUser._id;
    }

    // Send OTP email
    try {
      await sendOtpMail(email, otp);
    }catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email.",
        error: emailError.message, // for debugging - remove in production
  });
}

    // Return response (do NOT send OTP in production)
    return res.status(201).json({
      success: true,
      message: "OTP sent successfully.",
      data: { mobileNumber, userId, otp }
    });

  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber)
      return res.status(400).json({ message: "Phone number is required" });

    const isValidPhone = /^[6-9]\d{9}$/.test(mobileNumber);
    if (!isValidPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mobile number format." });
    }

    // Check if user exists
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "User is not verified. Please complete OTP verification during registration.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    return res.status(200).json({
      message: "OTP sent successfully",
      success: true,
      data: { otp, mobileNumber },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Mobile number and OTP are required" });

    const user = await User.findOne({ mobileNumber });

    // Soft-delete check
    if (!user || user.isDeleted)
      return res.status(404).json({ success: false, message: "Invalid OTP or expired." });

    // OTP existence and expiry (check expiry first)
    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid OTP or expired." });
    }

    // Too many attempts? (brute-force prevention)
    if (
      user.loginAttempts >= 5 &&
      user.lockUntil &&
      user.lockUntil > Date.now()
    ) {
      return res
        .status(429)
        .json({
          success: false,
          message: "Too many attempts. Try again later.",
          retryAfter: user.lockUntil,
        });
    }

    // Compare OTP as string
    if (user.otp !== otp) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
      }
      await user.save();
      return res.status(400).json({ success: false, message: "Invalid OTP or expired." });
    }

    // OTP verified → clear otp, reset login attempts & lock
    user.otp = "";
    user.otpExpiresAt = null;
    user.loginAttempts = 0;
    user.lockUntil = null;

    let isRegistered = false;
    if (!user.isVerified) {
      user.isVerified = true;
      isRegistered = true;
    }

    await user.save();

    // Use model method for access token
    const token = user.generateAccessToken();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      userId: user._id,
      userName: user.userName,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage || "",
      token,
      ...(isRegistered && { isRegistered: true }),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number is required" });
    }

    // Find user and check not soft deleted
    const user = await User.findOne({ mobileNumber, isDeleted: false });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or not allowed" });
    }

    // (Optional) Block resend if user is already verified. Uncomment if needed.
     if (user.isVerified) {
       return res.status(400).json({ success: false, message: "User already verified. Please login." });
     }

    // Generate new OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP and expiry to user
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // --- Send OTP via SMS/Email (implement your own sending logic here) ---
    // await sendOtpSms(user.mobileNumber, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully.",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    // If you want to clear refreshToken from DB (optional but secure)
    // You'll need user's id from the request (set by auth middleware)
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });
    }

    // Clear the cookies (accessToken and refreshToken)
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:true,
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: true
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required."
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format."
      });
    }

    // Exclude sensitive fields
    const user = await User.findOne({ _id: userId, isDeleted: false })
      .select('-otp -otpExpiresAt -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided ID."
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found successfully.",
      user
    });
  } catch (error) {
    console.error(`Error while finding user by ID: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  logout,
  getUserById,
};
