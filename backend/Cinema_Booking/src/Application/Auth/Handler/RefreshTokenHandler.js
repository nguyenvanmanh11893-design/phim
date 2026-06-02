// Application/Auth/Handler/RefreshTokenHandler.js
import jwt from "jsonwebtoken";
import AppError from "../../../Domain/Errors/AppError.js";
import { env } from "../../../Infrastructure/Config/env.js";

class RefreshTokenHandler {
  constructor(refreshTokenRepository, userRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.userRepository = userRepository;
  }

  async execute(command) {
    const { refreshToken } = command;

    if (!refreshToken) {
      throw new AppError("Refresh token không được để trống", 400);
    }

    // ── Bước 1: Tìm refresh token trong DB ────────────────────────────
    const storedToken =
      await this.refreshTokenRepository.findByToken(refreshToken);

    if (!storedToken) {
      throw new AppError("Refresh token không hợp lệ", 401);
    }

    // ── Bước 2: Kiểm tra còn hạn không ───────────────────────────────
    if (storedToken.isExpired()) {
      // Dọn luôn token hết hạn
      await this.refreshTokenRepository.deleteByToken(refreshToken);
      throw new AppError(
        "Refresh token đã hết hạn, vui lòng đăng nhập lại",
        401,
      );
    }

    // ── Bước 3: Lấy thông tin user ────────────────────────────────────
    const user = await this.userRepository.findById(storedToken.userId);

    if (!user) {
      throw new AppError("Người dùng không tồn tại", 401);
    }

    // ── Bước 4: Sinh Access Token mới ─────────────────────────────────
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return { accessToken: newAccessToken };
  }
}

export default RefreshTokenHandler;
