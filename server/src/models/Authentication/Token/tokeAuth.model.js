import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userTokenSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    profileImage: {
      // Cloudinary image save
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
    },
    fathersName: {
      type: String,
    },
    mothersName: {
      type: String,
    },
    dob: {
      type: Date,
    },
    heighestQualification: {
      type: String,
      enum: [
        "High School",
        "Intermediate",
        "Graduation",
        "Post-graduation",
        "Phd",
      ],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean, // Email verification
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// 🔒 Hash password and otp before saving
userTokenSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  // Hashing otp
  if (this.isModified("otp") && this.otp && !this.otp.startsWith("$2b$")) {
    this.otp = await bcrypt.hash(this.otp.toString(), 10);
  }
  next();
});

// 🔐 Compare password
userTokenSchema.methods.isPasswordCorrect = async function (inputPassword) {
  return await bcrypt.compare(inputPassword.toString(), this.password);
};

// 🔐 Compare OTP
userTokenSchema.methods.isOtpCorrect = async function (plainOtp) {
  return await bcrypt.compare(plainOtp.toString(), this.otp);
};

// 🔑 Generate Access Token
userTokenSchema.methods.generateAccessToken = function () {
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
userTokenSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

// 🔑 Generate OTP Token
userTokenSchema.methods.generateOtpToken = function () {
  return jwt.sign({ _id: this._id }, process.env.OTP_TOKEN_SECRET, {
    expiresIn: process.env.OTP_TOKEN_EXPIRY,
  });
};

const UserToken = mongoose.model("UserToken", userTokenSchema);
export default UserToken;
