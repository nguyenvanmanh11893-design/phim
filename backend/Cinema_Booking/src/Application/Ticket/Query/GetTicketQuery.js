// src/Application/Ticket/Query/GetTicketQuery.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetTicketQuery {
  /**
   * Query để lấy thông tin vé điện tử dựa trên bookingId.
   * Cần truyền kèm userId để verify ownership (tránh việc user A xem vé của user B).
   */
  constructor({ bookingId, userId }) {
    // ── bookingId — ID của booking chứa vé ────────────────────────────
    if (
      !bookingId ||
      !Number.isInteger(Number(bookingId)) ||
      Number(bookingId) <= 0
    ) {
      throw new AppError(
        "bookingId is required and must be a positive integer",
        400,
      );
    }

    // ── userId — Lấy từ req.user qua middleware xác thực ──────────────
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    this.bookingId = Number(bookingId);
    this.userId = Number(userId);
  }
}

export default GetTicketQuery;
