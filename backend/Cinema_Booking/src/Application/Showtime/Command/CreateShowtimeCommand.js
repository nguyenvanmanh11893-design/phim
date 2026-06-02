// Application/Showtime/Command/CreateShowtimeCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class CreateShowtimeCommand {
  constructor({
    movieId,
    roomId,
    startTime,
    basePrice,
    vipPrice,
    couplePrice,
  }) {
    // ── movieId ───────────────────────────────────────────────────────
    if (
      !movieId ||
      !Number.isInteger(Number(movieId)) ||
      Number(movieId) <= 0
    ) {
      throw new AppError(
        "movieId is required and must be a positive integer",
        400,
      );
    }

    // ── roomId ────────────────────────────────────────────────────────
    if (!roomId || !Number.isInteger(Number(roomId)) || Number(roomId) <= 0) {
      throw new AppError(
        "roomId is required and must be a positive integer",
        400,
      );
    }

    // ── startTime ─────────────────────────────────────────────────────
    if (!startTime) {
      throw new AppError("startTime is required", 400);
    }
    const parsedStart = new Date(startTime);
    if (isNaN(parsedStart.getTime())) {
      throw new AppError("startTime is not a valid date", 400);
    }
    if (parsedStart <= new Date()) {
      throw new AppError("startTime phải là thời điểm trong tương lai", 400);
    }

    // ── basePrice ─────────────────────────────────────────────────────
    if (basePrice === undefined || basePrice === null) {
      throw new AppError("basePrice is required", 400);
    }
    if (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0) {
      throw new AppError("basePrice must be a non-negative number", 400);
    }

    // ── vipPrice ──────────────────────────────────────────────────────
    if (vipPrice === undefined || vipPrice === null) {
      throw new AppError("vipPrice is required", 400);
    }
    if (!Number.isFinite(Number(vipPrice)) || Number(vipPrice) < 0) {
      throw new AppError("vipPrice must be a non-negative number", 400);
    }

    // ── couplePrice ───────────────────────────────────────────────────
    if (couplePrice === undefined || couplePrice === null) {
      throw new AppError("couplePrice is required", 400);
    }
    if (!Number.isFinite(Number(couplePrice)) || Number(couplePrice) < 0) {
      throw new AppError("couplePrice must be a non-negative number", 400);
    }

    // ── Giá VIP và COUPLE phải >= basePrice ───────────────────────────
    // Nghiệp vụ: ghế xịn hơn thì không được rẻ hơn ghế thường
    if (Number(vipPrice) < Number(basePrice)) {
      throw new AppError("vipPrice phải lớn hơn hoặc bằng basePrice", 400);
    }
    if (Number(couplePrice) < Number(basePrice)) {
      throw new AppError("couplePrice phải lớn hơn hoặc bằng basePrice", 400);
    }

    this.movieId = Number(movieId);
    this.roomId = Number(roomId);
    this.startTime = parsedStart;
    this.basePrice = Number(basePrice);
    this.vipPrice = Number(vipPrice);
    this.couplePrice = Number(couplePrice);
  }
}

export default CreateShowtimeCommand;
