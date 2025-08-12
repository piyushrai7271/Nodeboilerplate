import mongoose from "mongoose";
import jwt from "jsonwebtoken";

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
    }
  },
  { timestamps: true }
);

// 🔒 Hash password and otp before saving
// otpAuthSchema.pre("save", async function(next){
//     if(!this.isModified("otp"))
// })

const OtpAuth = mongoose.model("OtpAuth", otpAuthSchema);
export default OtpAuth;
