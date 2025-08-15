import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const otpAuthSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    mobileNumber: {
      type: String,
      index: true,
      unique: true,
      match: [
        /^(?:\+91|91)?[6-9]\d{9}$/,
        "Please enter a valid Indian mobile number (10 digits, optionally with +91 or 91)",
      ],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      // Cloudinary image URL
      type: String,
      default: "",
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean, // Email or Mobile verification
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// ✅ TODO: 🔒 In future, hash refreshToken for extra security 🔐

// 🔒 Hash OTP before saving
otpAuthSchema.pre("save", async function (next) {
  try {
    if (
      (!this.isModified("otp") && !this.isNew) ||
      !this.otp ||
      !this.otp.trim()
    ) {
      return next();
    }
    this.otp = await bcrypt.hash(this.otp, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Compare OTP with expiry check
otpAuthSchema.methods.isOtpCorrect = async function (inputOtp) {
  if (!this.otpExpiresAt || Date.now() > this.otpExpiresAt.getTime()) {
    return false; // Expired
  }
  return bcrypt.compare(inputOtp, this.otp);
};

// 🔑 Generate Access Token
otpAuthSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// 🔄 Generate Refresh Token
otpAuthSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

// 🔑 Generate OTP Token
otpAuthSchema.methods.generateOtpToken = function () {
  return jwt.sign({ _id: this._id }, process.env.OTP_TOKEN_SECRET, {
    expiresIn: process.env.OTP_TOKEN_EXPIRY,
  });
};

const UserOtp = mongoose.model("UserOtp", otpAuthSchema);
export default UserOtp;
