import twilio from "twilio";

const otpVerifySms = async (user) => {
  try {
    if (!user.mobileNumber) {
      return { success: false, message: "User does not have a valid mobile number." };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Only update user object, don't save here
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const messageBody = `Your login OTP for ${process.env.APP_NAME || "NODEBOILERPLATE"} is ${otp}. It is valid for 10 minutes.`;

    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${user.mobileNumber}`,
    });

    return {
      success: true,
      message: "OTP SMS sent successfully.",
    };
  } catch (error) {
    console.error("❌ Error sending OTP SMS:", error);
    return { success: false, message: "Failed to send OTP via SMS." };
  }
};

export default otpVerifySms;






// import twilio from "twilio";

// const otpVerifySms = async (user) => {
//   try {
//     // 1️⃣ Validate mobile number presence
//     if (!user.mobileNumber) {
//       return {
//         success: false,
//         message: "User does not have a valid mobile number.",
//       };
//     }

//     // 2️⃣ Initialize Twilio client
//     const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//     // 3️⃣ Generate 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // 4️⃣ Save OTP to user (hashed if implemented)
//     user.otp = otp;
//     user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
//     await user.save();

//     // 5️⃣ Prepare SMS content
//     const messageBody = `Your login OTP for ${process.env.APP_NAME || "NODEBOILERPLATE"} is ${otp}. It is valid for 10 minutes. Do not share it with anyone.`;

//     // 6️⃣ Send SMS
//     await client.messages.create({
//       body: messageBody,
//       from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
//       to: `+91${user.mobileNumber}`, // ✅ Adjust for country code
//     });

//     return {
//       success: true,
//       message: "OTP SMS sent successfully.",
//       // otp, // ❌ Don't return in production
//     };
//   } catch (error) {
//     console.error("❌ Error sending OTP SMS:", error);
//     return {
//       success: false,
//       message: "Failed to send OTP via SMS.",
//     };
//   }
// };

// export default otpVerifySms;
