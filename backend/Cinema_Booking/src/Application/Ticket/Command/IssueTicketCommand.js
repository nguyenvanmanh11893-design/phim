// src/Application/Ticket/Command/IssueTicketCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class IssueTicketCommand {
  /**
   * Command để yêu cầu xuất vé cho một booking.
   * Thường được gọi sau khi Booking đã chuyển sang trạng thái CONFIRMED.
   */
  constructor({ bookingId, userId }) {
    // ── bookingId — ID của booking cần xuất vé ────────────────────────
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

    // ── userId — Lấy từ req.user để verify ownership trong Handler ────
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

export default IssueTicketCommand;
