// src/Application/Booking/Query/ListBookingsQuery.js
import AppError from "../../../Domain/Errors/AppError.js";

const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"];

class ListBookingsQuery {
  constructor({ userId, status, page, limit } = {}) {
    // ── userId — bắt buộc, lấy từ req.user sau khi qua authMiddleware ─
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    // ── Phân trang ────────────────────────────────────────────────────
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      page !== undefined &&
      (!Number.isInteger(parsedPage) || parsedPage < 1)
    ) {
      throw new AppError("page must be a positive integer", 400);
    }

    if (
      limit !== undefined &&
      (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)
    ) {
      throw new AppError(
        "limit must be a positive integer and no greater than 100",
        400,
      );
    }

    // ── Filter theo status ────────────────────────────────────────────
    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      throw new AppError(
        `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        400,
      );
    }

    this.userId = Number(userId);
    this.status = status ?? null;
    this.page = parsedPage || 1;
    this.limit = parsedLimit || 10;
  }
}

export default ListBookingsQuery;
