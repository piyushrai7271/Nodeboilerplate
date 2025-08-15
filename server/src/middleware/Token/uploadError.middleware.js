// middlewares/uploadError.middleware.js
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error("❌ File Upload Error:", err.message);
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed",
        });
      }
      next();
    });
  };
};

export default handleUploadError;
