// src/Application/User/Handler/UpdateUserRoleHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class UpdateUserRoleHandler {
  /**
   * @param {import('../../../Domain/User/Repository/UserRepositoryInterface.js').default} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(command) {
    const { targetUserId, role } = command;

    // ── Bước 1: Fetch user cần đổi role ───────────────────────────────
    const user = await this.userRepository.findById(targetUserId);

    if (!user) {
      throw new AppError(`User với id=${targetUserId} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra role có thay đổi không ───────────────────────
    // Không cần update nếu role đã giống rồi
    if (user.role === role) {
      return {
        message: `User id=${targetUserId} đã ở role "${role}" từ trước`,
        user: user.toJSON(),
      };
    }

    // ── Bước 3: Gọi domain method — mutation nằm trong Entity ─────────
    if (role === "admin") {
      user.promoteToAdmin();
    } else {
      user.demoteToUser();
    }

    // ── Bước 4: Persist ────────────────────────────────────────────────
    const updatedUser = await this.userRepository.update(user);

    return {
      message: `Cập nhật role thành công: User id=${targetUserId} → "${role}"`,
      user: updatedUser.toJSON(),
    };
  }
}

export default UpdateUserRoleHandler;
