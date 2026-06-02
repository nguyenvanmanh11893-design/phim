// Infrastructure/Http/Routes/uploadRoutes.js
import express from "express";
import { upload } from "../../Config/cloudinary.js";
import UploadController from "../Controllers/UploadController.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();
const uploadController = new UploadController();

// ── Xử lý lỗi từ multer — fileSize vượt giới hạn, sai định dạng, v.v. ────────
// Multer throw lỗi riêng, không phải AppError → cần wrap lại để errorMiddleware
// xử lý đúng format, nếu không Express sẽ trả HTML thay vì JSON
const handleMulterError = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File quá lớn, tối đa 5MB",
    });
  }

  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message, // "Chỉ chấp nhận file ảnh JPG, PNG, WEBP"
    });
  }

  next(err);
};

// POST /upload/image
// upload.single("image") — tên field phải là "image" trong form-data
router.post(
  "/image",
  authMiddleware,
  requireRole("admin"),
  upload.single("image"),
  handleMulterError,
  (req, res, next) => uploadController.uploadImage(req, res, next),
);

export default router;
