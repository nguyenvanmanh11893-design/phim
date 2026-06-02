// src/Application/User/Handler/ChangePasswordHandler.js
import bcrypt from "bcrypt";
import AppError from "../../../Domain/Errors/AppError.js";

const SALT_ROUNDS = 10;

class ChangePasswordHandler {
  /**
   * @param {import('../../../Domain/User/Repository/UserRepositoryInterface.js').default} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(command) {
    const { userId, oldPassword, newPassword } = command;

    // ── Bước 1: Fetch user — cần passwordHash để verify ───────────────
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError(`User với id=${userId} không tồn tại`, 404);
    }

    // ── Bước 2: Verify oldPassword ────────────────────────────────────
    // Không cho đổi mật khẩu nếu không biết mật khẩu cũ
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new AppError("Mật khẩu cũ không đúng", 401);
    }

    // ── Bước 3: Hash mật khẩu mới ────────────────────────────────────
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // ── Bước 4: Gọi domain method — mutation nằm trong Entity ─────────
    // changePassword() tự set updatedAt = new Date()
    try {
      user.changePassword(newPasswordHash);
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 5: Persist ────────────────────────────────────────────────
    await this.userRepository.update(user);

    return { message: "Đổi mật khẩu thành công" };
  }
}

export default ChangePasswordHandler;
