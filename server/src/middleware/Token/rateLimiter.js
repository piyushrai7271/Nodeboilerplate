import rateLimit from "express-rate-limit";

/**
 * 🛡️ Login Attempt Limiter
 * Prevents brute force attacks on login endpoint
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts allowed
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Adds RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

/**
 * 🛡️ OTP Verification Limiter
 * Prevents brute force guessing of OTPs
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 verification attempts
  message: {
    success: false,
    message: "Too many OTP verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 🛡️ OTP Resend Limiter
 * Prevents abuse of resend OTP feature
 */
const otpResendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Max 3 resend requests in 5 minutes
  message: {
    success: false,
    message:
      "Too many OTP resend requests. Please wait 5 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 🛡️ General Purpose Limiter
 * Can be applied to any sensitive route
 */
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 requests per minute
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export {
    loginLimiter,
    otpVerifyLimiter,
    otpResendLimiter,
    generalLimiter
}
