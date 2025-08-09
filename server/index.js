import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { app } from './app.js';

dotenv.config({
  path: './.env',
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5100, () => {
      console.log(`🌐⚡ App running at Port : ${process.env.PORT || 5100}`);
    });
  })
  .catch((err) => {
    console.log(`⚠️ MongoDB connection error: ${err}`);
  });
