// /config/cloudinary.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// Configure Cloudinary with env variables
cloudinary.config({
  cloud_name:'piyushrai',
  api_key:632337845436632,
  api_secret:'kW1Q9qd4JP_uoygO-Rb9t7H54tI',
});

console.log(`cloudinary Api key : ${process.env.CLOUD_API_KEY}`);

// Allowed file extensions by type
const imageFormats = ["png", "jpg", "jpeg", "webp"];
const videoFormats = ["mp4", "mov", "avi", "mkv"];
const documentFormats = ["pdf", "doc", "docx", "xls", "xlsx"];

// Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

    // Validate file extension
    if (![...imageFormats, ...videoFormats, ...documentFormats].includes(ext)) {
      throw new Error(
        `Invalid file type. Allowed formats: ${[...imageFormats, ...videoFormats, ...documentFormats].join(", ")}.`
      );
    }

    // Determine resource type dynamically
    const resource_type = imageFormats.includes(ext)
      ? "image"
      : videoFormats.includes(ext)
      ? "video"
      : "raw";

    return {
      folder: "NODEBOILERPLATE", // <-- Change this for your project
      resource_type,
      type: "upload", // public upload
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

const upload = multer({ storage });

module.exports = {
  upload,
  cloudinary,
};
