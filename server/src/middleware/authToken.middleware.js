const User = require("../models/Authentication/user.model");
const jwt = require("jsonwebtoken");

const verifyJWT = async (req, res, next) => {
  try {
    // 1. Get token from cookies or Authorization header
    let token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace(/Bearer\s+/i, "")?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    // 2. Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      // Optional: console.error("JWT verification error:", err);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    // 3. Fetch user, exclude sensitive fields
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // 4. User found and active?
    if (!user || user.isDeleted || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("verifyJWT middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error in authentication",
    });
  }
};

module.exports = { verifyJWT };















// const  User  = require("../models/Authentication/user.model");
// const jwt = require("jsonwebtoken");

// const verifyJWT = async (req, res, next) => {
//   const token =
//     req.cookies?.accessToken ||
//     req.header("Authorization")?.replace("Bearer ", "")?.trim();

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Access token is required",
//     });
//   }

//   let decodedToken;
//   try {
//     decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//   } catch (err) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired access token",
//     });
//   }

//   const user = await User.findById(decodedToken?._id).select(
//     "-password -refreshToken"
//   );

//   if (!user) {
//     return res.status(401).json({
//       success: false,
//       message: "User not found",
//     });
//   }

//   req.user = user;
//   next();
// };

// module.exports = { verifyJWT };
