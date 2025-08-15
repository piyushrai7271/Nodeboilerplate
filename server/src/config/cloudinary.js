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

// ✅ Allowed extensions and MIME types
const allowedExtensions = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "avif", // images
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx", // documents
];

const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// ✅ Utility to sanitize file names (remove spaces & special chars)
const sanitizeFileName = (filename) => {
  return filename
    .replace(/\s+/g, "_") // replace spaces with underscore
    .replace(/[^a-zA-Z0-9._-]/g, ""); // remove special characters
};

// 🌥️ Multer Cloudinary Storage with auto resource type
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (!allowedExtensions.includes(ext)) {
      throw new Error("Invalid file type. Allowed: images or docs only.");
    }

    const sanitizedName = sanitizeFileName(file.originalname);

    return {
      folder: "NodeBoilerPlate", // ✅ Hardcoded folder name
      resource_type: "auto", // ✅ Let Cloudinary decide (image/raw/video)
      type: "upload",
      public_id: `${Date.now()}-${sanitizedName}`,
    };
  },
});

// 📦 Multer middleware with MIME type validation and error handling
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type."), false);
    }
    cb(null, true);
  },
});

// 🌐 Public Cloudinary URL generator
const getPublicCloudinaryUrl = (public_id) => {
  return cloudinary.url(`NodeBoilerPlate/${public_id}`, {
    resource_type: "auto",
    type: "upload",
    secure: true,
  });
};

export { upload, cloudinary, getPublicCloudinaryUrl };
