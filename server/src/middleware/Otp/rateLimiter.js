import rateLimit from "express-rate-limit";

// 🔹 Login Limiter (Email/Mobile-based)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  keyGenerator: (req) => req.body.email || req.body.mobileNumber || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔹 OTP Verify Limiter
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5,
  keyGenerator: (req) => req.userId || req.ip, // ✅ use userId after middleware
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many OTP verification attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔹 OTP Resend Limiter
const otpResendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 3,
  keyGenerator: (req) => req.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many OTP resend requests. Please wait 5 minutes before trying again.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔹 General Limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 60,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { loginLimiter, otpVerifyLimiter, otpResendLimiter, generalLimiter };
