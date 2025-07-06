const express = require("express");
const { verifyJWT } = require("../../../middleware/authToken.middleware");
const { upload } = require("../../../config/cloudinary");
const {
  registerUser,
  loginUser,
  logoutUser,
  resetUserPassword,
  getCurrentUser,
  getUserById,
  updateUserDetails,
  softDeleteUser,
  hardDeleteUser,
} = require("../../../controllers/Authentication/Token/userTokenAuth.controller");

const router = express.Router();

// ✅ PUBLIC routes
router.post("/registerUser", upload.single("profileImage"), registerUser);
router.post("/loginUser", loginUser);

// ✅ PRIVATE routes (must be logged in)
router.post("/logoutUser", verifyJWT, logoutUser);
router.post("/resetUserPassword", verifyJWT, resetUserPassword);
router.get("/getCurrentUser", verifyJWT, getCurrentUser);
router.get("/getUserById/:userId", verifyJWT, getUserById); // e.g. for admin or self
router.put("/updateUserDetails", verifyJWT, upload.single("profileImage"), updateUserDetails);
router.delete("/softDeleteUser", verifyJWT, softDeleteUser);
router.delete("/hardDeleteUser", verifyJWT, hardDeleteUser);

module.exports = router;


