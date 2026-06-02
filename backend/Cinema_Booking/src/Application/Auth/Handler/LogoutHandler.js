// Application/Auth/Handler/LogoutHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class LogoutHandler {
  constructor(refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute(command) {
    const { refreshToken, logoutAll, userId } = command;

    // Logout tất cả thiết bị
    if (logoutAll) {
      await this.refreshTokenRepository.deleteAllByUserId(userId);
      return { message: "Đã đăng xuất khỏi tất cả thiết bị" };
    }

    // Logout thiết bị hiện tại
    if (!refreshToken) {
      throw new AppError("Refresh token không được để trống", 400);
    }

    await this.refreshTokenRepository.deleteByToken(refreshToken);
    return { message: "Đăng xuất thành công" };
  }
}

export default LogoutHandler;
