const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    origin: process.env.CORS,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Import routes
const userTokenRoutes = require("./src/routes/Authentication/Token/userToken.routes");
const userOtpRoutes = require("./src/routes/Authentication/Otp/userOtp.routes");


// User Authentication routes
app.use("/api/token", userTokenRoutes);
app.use("/api/otp", userOtpRoutes);

module.exports = { app };
