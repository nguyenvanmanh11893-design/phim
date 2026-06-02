// src/Application/User/Handler/UpdateProfileHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class UpdateProfileHandler {
  /**
   * @param {import('../../../Domain/User/Repository/UserRepositoryInterface.js').default} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(command) {
    const { userId, name, phone, dateOfBirth, avatarUrl } = command;

    // ── Bước 1: Fetch entity hiện tại ─────────────────────────────────
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError(`User với id=${userId} không tồn tại`, 404);
    }

    // ── Bước 2: Gọi domain method — merge + validate nằm trong Entity ──
    // updateProfile() chỉ ghi đè field được truyền vào (không undefined)
    // và tự set updatedAt = new Date()
    try {
      user.updateProfile({ name, phone, dateOfBirth, avatarUrl });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 3: Persist ────────────────────────────────────────────────
    const updatedUser = await this.userRepository.update(user);

    return updatedUser.toJSON();
  }
}

export default UpdateProfileHandler;
