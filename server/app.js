import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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

//Route Import starts..
import userTokenRoutes from "./src/routes/Authentication/Token/tokenAuth.routes.js";
import userOtpRoutes from "./src/routes/Authentication/Otp/otpAuth.routes.js";

// User Authentication routes
app.use("/api/token", userTokenRoutes);
app.use("/api/otp", userOtpRoutes);

export { app };
