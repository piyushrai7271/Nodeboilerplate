const otpEmailTemplate = (user, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: #fff;">
        <h1 style="margin: 0;">${process.env.APP_NAME || "NODEBOILERPLATE"}</h1>
      </div>

      <!-- Body -->
      <div style="padding: 20px;">
        <h2 style="color: #333;">🔐 Email Verification</h2>
        <p>Hi <strong>${user.fullName || "User"}</strong>,</p>
        <p>Thank you for signing up! Please use the OTP below to verify your account:</p>

        <!-- OTP Display -->
        <div style="text-align: center; margin: 30px 0;">
          <span style="
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            font-size: 24px;
            letter-spacing: 4px;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
          ">
            ${otp}
          </span>
          <p style="margin-top: 10px; color: #777;">This OTP is valid for <strong>10 minutes</strong>.</p>
        </div>

        <!-- Security Notice -->
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; border: 1px solid #ffeeba;">
          ⚠️ <strong>Security Tip:</strong> Never share your OTP with anyone. Our team will never ask for it via phone, email, or chat.
        </div>

        <p>If you didn’t request this, you can safely ignore this email.</p>

        <p style="margin-top: 40px;">Best regards,<br><strong>${process.env.APP_NAME || "NODEBOILERPLATE"} Team</strong></p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
        This is an automated message, please do not reply.
      </div>
    </div>
  `;
};

export default otpEmailTemplate;
