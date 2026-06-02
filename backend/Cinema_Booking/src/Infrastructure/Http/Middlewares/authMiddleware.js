// Infrastructure/Http/Middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import AppError from "../../../Domain/Errors/AppError.js";
import { env } from "../../Config/env.js";

const authMiddleware = async (req, res, next) => {
  try {
    // ── Bước 1: Lấy token từ header ───────────────────────────────────
    // Client gửi: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("Không tìm thấy token xác thực", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError("Định dạng token không hợp lệ", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError("Token không được để trống", 401);
    }

    // ── Bước 2: Verify token ──────────────────────────────────────────
    // jwt.verify throw lỗi nếu:
    //   - Token bị giả mạo (sai signature)
    //   - Token đã hết hạn (exp < now)
    //   - Token sai định dạng
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // decoded = { userId: 42, role: 'user', iat: ..., exp: ... }

    // ── Bước 3: Gắn thông tin user vào request ────────────────────────
    // Các handler/controller phía sau dùng req.user để biết ai đang gọi
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    // ── Bước 4: Xử lý các loại lỗi JWT cụ thể ────────────────────────
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Token đã hết hạn, vui lòng đăng nhập lại", 401),
      );
    }

    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Token không hợp lệ", 401));
    }

    // Lỗi AppError tự throw ở trên (không có header, sai định dạng...)
    // hoặc lỗi bất ngờ khác → đẩy thẳng sang errorMiddleware
    next(err);
  }
};

export default authMiddleware;
