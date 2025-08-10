import dotenv from "dotenv";
dotenv.config();

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import path from "path";

// 🔐 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Allowed formats
const allowedFormats = [
  "png", "jpg", "jpeg", "webp", "svg", "avif", // images
  "pdf", "doc", "docx", "xls", "xlsx",        // documents
];

// 🌥️ Multer Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!allowedFormats.includes(ext)) {
      throw new Error("❌ Invalid file type.");
    }
    const resource_type = ["png", "jpg", "jpeg", "webp", "svg", "avif"].includes(ext)
      ? "image"
      : "raw";
    return {
      folder: "CTRD",
      resource_type,
      type: "upload",
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// 📦 Multer middleware
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!allowedFormats.includes(ext)) {
      return cb(new Error("❌ Unsupported file type."), false);
    }
    cb(null, true);
  },
});

// 🌐 Public Cloudinary URL generator
const getPublicCloudinaryUrl = (public_id, resource_type = "raw") => {
  return cloudinary.url(`NODEBOILERPLATE/${public_id}`, {
    resource_type,
    type: "upload",
    secure: true,
    flags: "attachment:false",
  });
};

export { upload, cloudinary, getPublicCloudinaryUrl };
