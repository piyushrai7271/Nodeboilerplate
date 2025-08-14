import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const otpAuthSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
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
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
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
      // Cloudinary image save
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
      type: Boolean, // Email verification
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
      default: "",
      select:false
    },
  },
  { timestamps: true }
);

// 🔒 Hash OTP before saving
otpAuthSchema.pre("save", async function (next) {
  try {
    // Only hash if OTP exists and is new or modified
    if ((!this.isModified("otp") && !this.isNew) || !this.otp || !this.otp.trim()) {
      return next();
    }
    this.otp = await bcrypt.hash(this.otp, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Compare Otp
otpAuthSchema.methods.isOtpCorrect = async function (inputOtp) {
  if (this.otpExpiresAt && this.otpExpiresAt < Date.now()) {
    return false; // expired
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

const OtpAuth = mongoose.model("OtpAuth", otpAuthSchema);
export default OtpAuth;
