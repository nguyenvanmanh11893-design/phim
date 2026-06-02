import AppError from "../../../Domain/Errors/AppError.js";

const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"];

class ListAllBookingsQuery {
  constructor({ status, userId, page, limit } = {}) {
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

    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      throw new AppError(
        `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        400,
      );
    }

    if (
      userId !== undefined &&
      (!Number.isInteger(Number(userId)) || Number(userId) <= 0)
    ) {
      throw new AppError("userId must be a positive integer", 400);
    }

    this.page = parsedPage || 1;
    this.limit = parsedLimit || 10;
    this.status = status ?? null;
    this.userId = userId !== undefined ? Number(userId) : null;
  }
}

export default ListAllBookingsQuery;
