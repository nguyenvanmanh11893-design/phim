// src/Application/Rating/Query/GetMovieRatingsQuery.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetMovieRatingsQuery {
  constructor({ movieId, page, limit } = {}) {
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

    this.movieId = Number(movieId);
    this.page = parsedPage || 1;
    this.limit = parsedLimit || 10;
  }
}

export default GetMovieRatingsQuery;
