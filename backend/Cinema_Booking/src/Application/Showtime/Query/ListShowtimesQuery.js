// Application/Showtime/Query/ListShowtimesQuery.js
import AppError from "../../../Domain/Errors/AppError.js";

const ALLOWED_STATUSES = ["SCHEDULED", "ONGOING", "ENDED", "CANCELLED"];

class ListShowtimesQuery {
  constructor({ movieId, cinemaId, date, status, page, limit } = {}) {
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

    // ── movieId ───────────────────────────────────────────────────────
    if (movieId !== undefined) {
      if (!Number.isInteger(Number(movieId)) || Number(movieId) <= 0) {
        throw new AppError("movieId must be a positive integer", 400);
      }
    }

    // ── cinemaId ──────────────────────────────────────────────────────
    if (cinemaId !== undefined) {
      if (!Number.isInteger(Number(cinemaId)) || Number(cinemaId) <= 0) {
        throw new AppError("cinemaId must be a positive integer", 400);
      }
    }

    // ── date — chấp nhận "YYYY-MM-DD", parse thành Date ──────────────
    // Chỉ lấy phần ngày, bỏ giờ — Handler sẽ filter DATE(start_time) = date
    let parsedDate = null;
    if (date !== undefined) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new AppError(
          "date is not a valid date (expected YYYY-MM-DD)",
          400,
        );
      }
    }

    // ── status ────────────────────────────────────────────────────────
    // status của Showtime là computed — Repository phải tính động từ
    // start_time/end_time/cancelled_at khi query, không có cột status trong DB
    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      throw new AppError(
        `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        400,
      );
    }

    this.page = parsedPage || 1;
    this.limit = parsedLimit || 20;
    this.movieId = movieId !== undefined ? Number(movieId) : null;
    this.cinemaId = cinemaId !== undefined ? Number(cinemaId) : null;
    this.date = parsedDate;
    this.status = status ?? null;
  }
}

export default ListShowtimesQuery;
