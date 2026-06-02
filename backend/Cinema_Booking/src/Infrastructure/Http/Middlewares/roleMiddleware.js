// Infrastructure/Http/Middlewares/roleMiddleware.js
import AppError from "../../../Domain/Errors/AppError.js";

// Trả về middleware function — dùng như factory
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // roleMiddleware phải chạy SAU authMiddleware
    // vì cần req.user đã được gắn vào trước
    if (!req.user) {
      return next(new AppError("Chưa xác thực", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("Bạn không có quyền thực hiện hành động này", 403),
      );
    }

    next();
  };
};

export default requireRole;
