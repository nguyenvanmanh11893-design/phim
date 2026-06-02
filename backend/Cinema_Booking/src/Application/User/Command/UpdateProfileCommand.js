// src/Application/User/Command/UpdateProfileCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class UpdateProfileCommand {
  constructor({ userId, name, phone, dateOfBirth, avatarUrl }) {
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    // ── Phải có ít nhất 1 field để update ─────────────────────────────
    const updatableFields = [name, phone, dateOfBirth, avatarUrl];
    if (updatableFields.every((f) => f === undefined)) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        throw new AppError("name phải có ít nhất 2 ký tự", 400);
      }
    }

    if (phone !== undefined && phone !== null) {
      if (typeof phone !== "string" || !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
        throw new AppError("phone không đúng định dạng", 400);
      }
    }

    if (dateOfBirth !== undefined && dateOfBirth !== null) {
      const parsed = new Date(dateOfBirth);
      if (isNaN(parsed.getTime())) {
        throw new AppError("dateOfBirth không phải ngày hợp lệ", 400);
      }
      if (parsed > new Date()) {
        throw new AppError(
          "dateOfBirth không được là ngày trong tương lai",
          400,
        );
      }
    }

    if (avatarUrl !== undefined && avatarUrl !== null) {
      if (typeof avatarUrl !== "string") {
        throw new AppError("avatarUrl phải là string", 400);
      }
      try {
        new URL(avatarUrl);
      } catch {
        throw new AppError("avatarUrl không phải URL hợp lệ", 400);
      }
    }

    this.userId = Number(userId);
    this.name = name !== undefined ? name.trim() : undefined;
    this.phone = phone !== undefined ? (phone?.trim() ?? null) : undefined;
    this.dateOfBirth =
      dateOfBirth !== undefined
        ? dateOfBirth !== null
          ? new Date(dateOfBirth)
          : null
        : undefined;
    this.avatarUrl =
      avatarUrl !== undefined ? (avatarUrl?.trim() ?? null) : undefined;
  }
}

export default UpdateProfileCommand;
