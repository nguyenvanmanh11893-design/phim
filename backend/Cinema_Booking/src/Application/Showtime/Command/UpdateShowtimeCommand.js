// src/Application/Showtime/Command/UpdateShowtimeCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class UpdateShowtimeCommand {
  constructor({ id, roomId, startTime, basePrice, vipPrice, couplePrice }) {
    // ── id là bắt buộc ────────────────────────────────────────────────
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    // ── Phải có ít nhất 1 trường để cập nhật ──────────────────────────
    const updatableFields = [
      roomId,
      startTime,
      basePrice,
      vipPrice,
      couplePrice,
    ];
    if (updatableFields.every((f) => f === undefined)) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    // ── Validate từng field (nếu có truyền vào) ───────────────────────
    if (roomId !== undefined) {
      if (!Number.isInteger(Number(roomId)) || Number(roomId) <= 0) {
        throw new AppError("roomId must be a positive integer", 400);
      }
    }

    let parsedStart = undefined;
    if (startTime !== undefined) {
      parsedStart = new Date(startTime);
      if (isNaN(parsedStart.getTime())) {
        throw new AppError("startTime is not a valid date", 400);
      }
      if (parsedStart <= new Date()) {
        throw new AppError("startTime phải là thời điểm trong tương lai", 400);
      }
    }

    if (basePrice !== undefined) {
      if (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0) {
        throw new AppError("basePrice must be a non-negative number", 400);
      }
    }

    if (vipPrice !== undefined) {
      if (!Number.isFinite(Number(vipPrice)) || Number(vipPrice) < 0) {
        throw new AppError("vipPrice must be a non-negative number", 400);
      }
    }

    if (couplePrice !== undefined) {
      if (!Number.isFinite(Number(couplePrice)) || Number(couplePrice) < 0) {
        throw new AppError("couplePrice must be a non-negative number", 400);
      }
    }

    this.id = Number(id);
    this.roomId = roomId !== undefined ? Number(roomId) : undefined;
    this.startTime = parsedStart;
    this.basePrice = basePrice !== undefined ? Number(basePrice) : undefined;
    this.vipPrice = vipPrice !== undefined ? Number(vipPrice) : undefined;
    this.couplePrice =
      couplePrice !== undefined ? Number(couplePrice) : undefined;
  }
}

export default UpdateShowtimeCommand;
