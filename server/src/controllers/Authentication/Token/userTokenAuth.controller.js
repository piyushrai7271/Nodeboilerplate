const User = require("../../../models/Authentication/user.model");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw error;
  }
};

const registerUser = async (req, res) => {
  try {
    //Taking input which are required for register
    const {
      userName,
      fullname,
      email,
      mobileNumber,
      password,
      dob,
      address,
      gender,
    } = req.body;
    //validating the comming input
    if (
      !userName ||
      !fullname ||
      !email ||
      !mobileNumber ||
      !password ||
      !dob ||
      !address ||
      !gender
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }
    // checking that user already exist with that name , email and mobileNumber
    const existingUser = await User.findOne({
      $or: [{ email }, { mobileNumber }, { userName }],
      isDeleted: false,
    });
    // if user exist already than give error
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User with this email or mobileNumber or userNumber  already exists",
      });
    }
    // handling image
    let profileImageUrl = "";
    if (req.file && req.file.path) {
      profileImageUrl = req.file.path;
    }
    // creating new user in database with all details
    const newUser = new User({
      userName,
      fullname,
      email,
      mobileNumber,
      dob,
      address,
      gender,
      password,
      profileImage: profileImageUrl,
    });
    // saving new user in data base
    await newUser.save();

    // remove password from response
    const userObj = newUser.toObject();
    delete userObj.password;
    // return response if its all good
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      newUser: userObj,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User is not registered, Please register first.",
      });
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict", // Adjust based on your needs
    };

    return res
      .status(200)
      // .cookie("refreshToken", refreshToken, options)
      // .cookie("accessToken", accessToken, options)
      .json({
        success: true,
        message: "User logged in successfully",
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

const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", options)
      .cookie("accessToken", options)
      .json({
        success: true,
        message: "User logged out successfully",
      });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old password and new password",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent reusing the same password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password.",
      });
    }

    // Password strength check (example: min 8 chars, at least one digit)
    // if (!/(?=.*\d).{8,}/.test(newPassword)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Password must be at least 8 characters and contain a digit.",
    //   });
    // }

    // Validate old password
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    user.refreshToken = ""; // Invalidate old refresh tokens
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Current user retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    // Only find user if not soft deleted!
    const user = await User.findOne({ _id: userId, isDeleted: false }).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    console.log("Error retrieving user by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving user by ID",
    });
  }
};

const updateUserDetails = async (req, res) => {
 try {
    // ✅ List of fields that are allowed to be updated by the user
    const allowedFields = [
      "fullname",
      "userName",
      "email",
      "mobileNumber",
      "dob",
      "address",
      "gender",
      "profileImage",
    ];

    // ✅ Build updates object only with allowed fields present in the request body
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Trim string values to prevent accidental spaces
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    // ✅ If a file was uploaded (e.g., new profile image), add it to updates
    if (req.file?.path) {
      updates.profileImage = req.file.path;
    }

    // ✅ Validate gender value if provided (case-insensitive)
    if (
      updates.gender &&
      !["male", "female", "other"].includes(
        updates.gender.toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender value. Allowed: male, female, other.",
      });
    }

    // ✅ Restricted fields that should never be updated via this route
    const restrictedFields = [
      "password",
      "isVerified",
      "isActive",
      "otp",
      "otpExpiresIn",
      "refreshToken",
      "lastLogin",
      "loginAttempts",
      "lockUntil",
    ];
    for (const field of restrictedFields) {
      if (req.body[field] !== undefined) {
        return res.status(400).json({
          success: false,
          message: `Field "${field}" cannot be updated via this route.`,
        });
      }
    }

    // ✅ Extract user ID from request, must exist (verified by JWT middleware)
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Update the user with allowed fields only, and ensure user is not soft-deleted
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false }, // include isDeleted condition for soft delete
      { $set: updates },
      { new: true, runValidators: true, context: "query" }
    ).select(
      "-password -refreshToken -otp -otpExpiresIn -loginAttempts -lockUntil"
    );

    // ✅ If no user found, return 404
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Return success response with updated user (sensitive fields excluded)
    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    // ✅ Handle duplicate key errors for unique fields like email, username, or phone number
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A user with this ${field} already exists.`,
      });
    }

    // ✅ Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // ✅ Catch-all server error
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user profile",
    });
  }
};

const softDeleteUser = async (req, res) => {
  try {
    // ✅ Get user ID from JWT middleware
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found",
      });
    }

    // ✅ Perform soft delete: set isDeleted true, isActive false, and remove sensitive tokens
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false }, // only delete if not already deleted
      {
        $set: {
          isDeleted: true,
          isActive: false,
          refreshToken: "",
          otp: "",
          otpExpiresIn: null,
          lockUntil: null,
        },
      },
      { new: true }
    ).select(
      "-password -refreshToken -otp -otpExpiresIn -loginAttempts -lockUntil"
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted",
      });
    }

    // ✅ Clear cookies if applicable
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "User account soft deleted successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Soft delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to soft delete user account",
    });
  }
};

const hardDeleteUser = async (req, res) => {
  try {
    // ✅ Extract user ID from JWT middleware
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found",
      });
    }

    // ✅ Permanently remove the user document from the database
    const deletedUser = await User.findByIdAndDelete(userId).select(
      "-password -refreshToken -otp -otpExpiresIn -loginAttempts -lockUntil"
    );

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted",
      });
    }

    // ✅ Clear auth cookies to log the user out immediately
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "User account permanently deleted",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Hard delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete user account",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  resetUserPassword,
  getCurrentUser,
  getUserById,
  updateUserDetails,
  softDeleteUser,
  hardDeleteUser,
};
