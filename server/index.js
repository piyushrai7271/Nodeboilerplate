const dotenv = require('dotenv');
const { connectDB } = require('./src/config/db');
const { app } = require('./app');

dotenv.config({
  path: './.env',
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5100, () => {
      console.log(`App running at Port : ${process.env.PORT || 5100}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB connection error: ${err}`);
  });
