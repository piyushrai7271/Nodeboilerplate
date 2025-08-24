import jwt from "jsonwebtoken";
import UserOtp from "../../models/Authentication/Otp/otpAuth.model.js";

/* -----------------------------------------------
   🔹 Common Utility: Extract token from Request
------------------------------------------------- */

// 1️⃣ Extract OTP token from Authorization header or cookies
const getOtpTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const tokenFromCookie = req.cookies?.otpToken; // ✅ For OTP verification only
  return tokenFromHeader || tokenFromCookie;
};

// 1️⃣ Extract Access token from Authorization header or cookies
const getAccessTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const tokenFromCookie = req.cookies?.accessToken; // ✅ For long-lived sessions
  return tokenFromHeader || tokenFromCookie;
};

/* -----------------------------------------------
   🔹 Common Utility: Decode token with Error Handling
------------------------------------------------- */

// 2️⃣ Decode OTP token
const decodeOtpToken = (token) => {
  if (!token) throw new Error("No OTP token provided");
  if (!process.env.OTP_TOKEN_SECRET) throw new Error("OTP Token secret missing");
  return jwt.verify(token, process.env.OTP_TOKEN_SECRET);
};

// 2️⃣ Decode Access token
const decodeAccessToken = (token) => {
  if (!token) throw new Error("No Access token provided");
  if (!process.env.ACCESS_TOKEN_SECRET)
    throw new Error("Access Token secret missing");
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

/* -----------------------------------------------
   🔹 Middleware: OTP Token Validation (Login & Verify Routes)
------------------------------------------------- */

const userValidateOtpToken = async (req, res, next) => {
  try {
    // 1️⃣ Extract OTP token
    const token = getOtpTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: OTP token missing",
      });
    }

    // 2️⃣ Decode OTP token
    const decoded = decodeOtpToken(token);

    // 3️⃣ Find user from decoded token payload
    const userId = decoded._id || decoded.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP token payload",
      });
    }

    const user = await UserOtp.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // 4️⃣ Attach user to request object
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error("OTP token validation error:", error.message);

    const message =
      error.name === "TokenExpiredError"
        ? "OTP token has expired"
        : error.name === "JsonWebTokenError"
        ? "Invalid OTP token"
        : "OTP token validation failed";

    return res.status(401).json({ success: false, message });
  }
};

/* -----------------------------------------------
   🔹 Middleware: Access Token Validation (All Other Routes)
------------------------------------------------- */

const userValidateAccessToken = async (req, res, next) => {
  try {
    // 1️⃣ Extract Access token
    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access token missing",
      });
    }

    // 2️⃣ Decode Access token
    const decoded = decodeAccessToken(token);

    // 3️⃣ Find user from decoded token payload
    const userId = decoded._id || decoded.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid Access token payload",
      });
    }

    const user = await UserOtp.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // 4️⃣ Attach user to request object
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error("Access token validation error:", error.message);

    const message =
      error.name === "TokenExpiredError"
        ? "Access token has expired"
        : error.name === "JsonWebTokenError"
        ? "Invalid Access token"
        : "Access token validation failed";

    return res.status(401).json({ success: false, message });
  }
};

/* -----------------------------------------------
   🔹 Export both middlewares
------------------------------------------------- */
export { userValidateOtpToken, userValidateAccessToken };







// import jwt from "jsonwebtoken";
// import UserOtp from "../../models/Authentication/Otp/otpAuth.model.js";

// // 🔹 Extract token from either Authorization header or cookies
// const getTokenFromRequest = (req) => {
//   const authHeader = req.headers.authorization || req.headers.Authorization;
//   const tokenFromHeader = authHeader?.startsWith("Bearer ")
//     ? authHeader.split(" ")[1]
//     : null;
//   const tokenFromCookie = req.cookies?.otpToken; // ✅ OTP token should not use accessToken cookie
//   return tokenFromHeader || tokenFromCookie;
// };

// // 🔹 Decode JWT with proper error handling
// const decodeToken = (token, secret) => {
//   if (!token) {
//     throw new Error("No OTP token provided");
//   }
//   if (!secret) {
//     throw new Error("JWT secret is missing in environment variables");
//   }
//   return jwt.verify(token, secret);
// };

// // ✅ Middleware to validate OTP session token
// const userValidateOtpToken = async (req, res, next) => {
//   try {
//     // 1️⃣ Extract token
//     const token = getTokenFromRequest(req);
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: OTP token missing",
//       });
//     }

//     // 2️⃣ Decode token
//     const decoded = decodeToken(token, process.env.OTP_TOKEN_SECRET);

//     // 3️⃣ Find user based on decoded token payload
//     const userId = decoded._id || decoded.id;
//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP token payload",
//       });
//     }

//     const user = await UserOtp.findOne({ _id: userId, isDeleted: false });
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: User not found",
//       });
//     }

//     // 4️⃣ Attach user info to request object for controller use
//     req.user = user;
//     req.userId = user._id;

//     next();
//   } catch (error) {
//     console.error("OTP token validation error:", error.message);

//     const message =
//       error.name === "TokenExpiredError"
//         ? "OTP token has expired"
//         : error.name === "JsonWebTokenError"
//         ? "Invalid OTP token"
//         : "OTP token validation failed";

//     return res.status(401).json({ success: false, message });
//   }
// };

// export { userValidateOtpToken };
