// src/Application/Booking/Command/CreateBookingCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class CreateBookingCommand {
  constructor({ userId, showtimeId, seatIds, comboItems }) {
    // ── userId ────────────────────────────────────────────────────────
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    // ── showtimeId ────────────────────────────────────────────────────
    if (
      !showtimeId ||
      !Number.isInteger(Number(showtimeId)) ||
      Number(showtimeId) <= 0
    ) {
      throw new AppError(
        "showtimeId is required and must be a positive integer",
        400,
      );
    }

    // ── seatIds ───────────────────────────────────────────────────────
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new AppError("seatIds must be a non-empty array", 400);
    }

    if (
      seatIds.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)
    ) {
      throw new AppError("mỗi seatId phải là positive integer", 400);
    }

    // ── Không cho chọn trùng ghế trong cùng 1 booking ────────────────
    const uniqueIds = new Set(seatIds.map(Number));
    if (uniqueIds.size !== seatIds.length) {
      throw new AppError("seatIds không được trùng nhau", 400);
    }

    // ── Giới hạn số ghế mỗi lần đặt ──────────────────────────────────
    // Tránh 1 user chiếm quá nhiều ghế trong 1 booking
    const MAX_SEATS = 8;
    if (seatIds.length > MAX_SEATS) {
      throw new AppError(`Mỗi lần đặt tối đa ${MAX_SEATS} ghế`, 400);
    }

    // Validate comboItems: [{ comboId, quantity }]
    if (comboItems !== undefined) {
      if (!Array.isArray(comboItems)) {
        throw new AppError("comboItems phải là một mảng", 400);
      }
      comboItems.forEach((item) => {
        if (!item.comboId || !item.quantity || item.quantity <= 0) {
          throw new AppError("Mỗi combo phải có comboId và quantity > 0", 400);
        }
      });
    }

    this.userId = Number(userId);
    this.showtimeId = Number(showtimeId);
    this.seatIds = [...uniqueIds]; // đã convert sang Number
    this.comboItems = comboItems ?? [];
  }
}

export default CreateBookingCommand;
