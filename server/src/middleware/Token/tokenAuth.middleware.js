import jwt from "jsonwebtoken";
import UserToken from "../../models/Authentication/Token/tokeAuth.model.js";

// Get token from  authorization header or cookie
const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const tokenFromCookie = req.cookies?.accessToken;
  return tokenFromHeader || tokenFromCookie;
};

// Decode JWT token
const decodeToken = (token, secret) => {
  if (!token) {
    throw new Error("No token provided");
  } else if (!secret) {
    throw new Error("JWT secret is not defined in environment variables");
  } else {
    return jwt.verify(token, secret);
  }
};

const userValidateToken = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    const decoded = decodeToken(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await UserToken.findById(decoded._id || decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found",
      });
    }
    // 🔒 Ensure user has verified their email
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email to proceed",
      });
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error("Access token error:", error.message);
    const message =
      error.name === "TokenExpiredError"
        ? "Access token has expired"
        : error.name === "JsonWebTokenError"
        ? "Invalid access token"
        : error.message;
    return res.status(401).json({ success: false, message });
  }
};

// ✅ Middleware 2: Used ONLY for OTP verification — uses otpToken
const userValidateOtpToken = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    const decoded = decodeToken(token, process.env.OTP_TOKEN_SECRET);

    const user = await UserToken.findById(decoded._id || decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error("OTP token error:", error.message);
    const message =
      error.name === "TokenExpiredError"
        ? "OTP token has expired"
        : error.name === "JsonWebTokenError"
        ? "Invalid OTP token"
        : error.message;
    return res.status(401).json({ success: false, message });
  }
};

export {userValidateOtpToken,userValidateToken};
