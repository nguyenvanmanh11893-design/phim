import AppError from "../../../Domain/Errors/AppError.js";

class ListCinemasQuery {
  constructor({ page, limit, city } = {}) {
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

    if (city !== undefined && typeof city !== "string") {
      throw new AppError("city must be a string", 400);
    }

    this.page = parsedPage || 1;
    this.limit = parsedLimit || 20;
    this.city = city?.trim() ?? null;
  }
}

export default ListCinemasQuery;
