import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userTokenRoutes from './src/routes/Authentication/Token/userToken.routes.js';
import userOtpRoutes from './src/routes/Authentication/Otp/userOtp.routes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// User Authentication routes
app.use('/api/token', userTokenRoutes);
app.use('/api/otp', userOtpRoutes);

export { app };
