// Domain/Auth/Repository/RefreshTokenRepositoryInterface.js
import AppError from "../../Errors/AppError.js";

class RefreshTokenRepositoryInterface {
  // Lưu refresh token mới sau khi login
  async save(refreshToken) {
    throw new AppError("Not implemented", 500);
  }

  // Tìm theo token string — dùng trong RefreshTokenHandler
  async findByToken(token) {
    throw new AppError("Not implemented", 500);
  }

  // Xóa 1 token cụ thể — dùng khi logout
  async deleteByToken(token) {
    throw new AppError("Not implemented", 500);
  }

  // Xóa tất cả token của 1 user — logout tất cả thiết bị
  async deleteAllByUserId(userId) {
    throw new AppError("Not implemented", 500);
  }
}

export default RefreshTokenRepositoryInterface;
