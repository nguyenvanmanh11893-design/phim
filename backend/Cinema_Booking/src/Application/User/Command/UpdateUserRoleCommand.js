// src/Application/User/Command/UpdateUserRoleCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

const ALLOWED_ROLES = ["user", "admin"];

class UpdateUserRoleCommand {
  constructor({ targetUserId, role, requesterId }) {
    if (
      !targetUserId ||
      !Number.isInteger(Number(targetUserId)) ||
      Number(targetUserId) <= 0
    ) {
      throw new AppError(
        "targetUserId is required and must be a positive integer",
        400,
      );
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new AppError(
        `role is required and must be one of: ${ALLOWED_ROLES.join(", ")}`,
        400,
      );
    }

    if (
      !requesterId ||
      !Number.isInteger(Number(requesterId)) ||
      Number(requesterId) <= 0
    ) {
      throw new AppError(
        "requesterId is required and must be a positive integer",
        400,
      );
    }

    // ── Admin không thể tự hạ role của chính mình ─────────────────────
    // Tránh trường hợp hệ thống không còn admin nào
    if (Number(targetUserId) === Number(requesterId) && role === "user") {
      throw new AppError("Không thể tự hạ role của chính mình", 400);
    }

    this.targetUserId = Number(targetUserId);
    this.role = role;
    this.requesterId = Number(requesterId);
  }
}

export default UpdateUserRoleCommand;
