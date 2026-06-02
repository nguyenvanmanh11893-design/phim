import AppError from "../../../Domain/Errors/AppError.js";

class GetDashboardOverviewQuery {
  constructor({ userId }) {
    // ── userId — Lấy từ req.user qua middleware xác thực ──────────────
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    this.userId = Number(userId);
  }
}

export default GetDashboardOverviewQuery;
