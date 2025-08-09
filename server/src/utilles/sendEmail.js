import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or your provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

const sendOtpMail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`
  };
  await transporter.sendMail(mailOptions);
};

export {sendOtpMail}