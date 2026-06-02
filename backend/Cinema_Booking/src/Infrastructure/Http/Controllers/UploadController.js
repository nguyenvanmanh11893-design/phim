// Infrastructure/Http/Controllers/UploadController.js
import AppError from "../../../Domain/Errors/AppError.js";

class UploadController {
  // POST /upload/image
  async uploadImage(req, res, next) {
    try {
      // multer-storage-cloudinary gắn thông tin file vào req.file sau khi upload xong
      // Nếu không có req.file → client không gửi file lên
      if (!req.file) {
        throw new AppError("Không tìm thấy file ảnh trong request", 400);
      }

      // req.file.path   — URL đầy đủ của ảnh trên Cloudinary
      // req.file.filename — publicId, dùng sau này để xóa ảnh
      res.status(200).json({
        success: true,
        data: {
          url: req.file.path,
          publicId: req.file.filename,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export default UploadController;
