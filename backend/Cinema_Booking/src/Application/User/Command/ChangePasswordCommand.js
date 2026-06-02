// src/Application/User/Command/ChangePasswordCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class ChangePasswordCommand {
  constructor({ userId, oldPassword, newPassword }) {
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    if (!oldPassword || typeof oldPassword !== "string") {
      throw new AppError("oldPassword không được để trống", 400);
    }

    if (!newPassword || typeof newPassword !== "string") {
      throw new AppError("newPassword không được để trống", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("newPassword phải có ít nhất 6 ký tự", 400);
    }

    if (oldPassword === newPassword) {
      throw new AppError("newPassword không được trùng với oldPassword", 400);
    }

    this.userId = Number(userId);
    this.oldPassword = oldPassword;
    this.newPassword = newPassword;
  }
}

export default ChangePasswordCommand;
