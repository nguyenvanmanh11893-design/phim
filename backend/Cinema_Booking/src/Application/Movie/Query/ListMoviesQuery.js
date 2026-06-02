import AppError from "../../../Domain/Errors/AppError.js";

class ListMoviesQuery {
  constructor({ page, limit, genre, status } = {}) {
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

    // ── Filter status ─────────────────────────────────────────────────
    const allowedStatuses = ["coming_soon", "now_showing", "ended"];
    if (status !== undefined && !allowedStatuses.includes(status)) {
      throw new AppError(
        `status must be one of: ${allowedStatuses.join(", ")}`,
        400,
      );
    }

    // ── Filter genre ──────────────────────────────────────────────────
    if (genre !== undefined && typeof genre !== "string") {
      throw new AppError("genre must be a string", 400);
    }

    this.page = parsedPage || 1;
    this.limit = parsedLimit || 20;
    this.genre = genre ?? null;
    this.status = status ?? null;
  }
}

export default ListMoviesQuery;
