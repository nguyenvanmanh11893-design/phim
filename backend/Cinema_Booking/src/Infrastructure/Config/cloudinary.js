import { createRequire } from "module";
const require = createRequire(import.meta.url);

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
import { env } from "./env.js";

// ── Cấu hình Cloudinary credentials ──────────────────────────────────────────
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// ── Cấu hình storage ──────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cinema-app",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1920, crop: "limit" }, { quality: "auto" }],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Chỉ chấp nhận file ảnh JPG, PNG, WEBP"), false);
    }

    cb(null, true);
  },
});

export { cloudinary, upload };
