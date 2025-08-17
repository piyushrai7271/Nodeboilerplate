import nodemailer from "nodemailer";
import otpEmailTemplate from "./otp.emailTemplete.js";

const otpVerifyEmail = async (user) => {
  try {
    // 1️⃣ Configure Nodemailer transport
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2️⃣ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Save OTP to user (hashed in pre-save hook if implemented)
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();

    // 4️⃣ Prepare email
    const mailOptions = {
      from: `"${process.env.APP_NAME || "NODEBOILERPLATE"}" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "OTP for Account Verification",
      html: otpEmailTemplate(user, otp),
    };

    // 5️⃣ Send email
    await transport.sendMail(mailOptions);

    return {
      success: true,
      message: "OTP email sent successfully.",
      // otp, // ❌ Do not return in production
    };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return {
      success: false,
      message: "Failed to send OTP email.",
    };
  }
};

export default otpVerifyEmail;
