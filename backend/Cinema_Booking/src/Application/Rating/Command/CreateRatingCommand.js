// src/Application/Rating/Command/CreateRatingCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class CreateRatingCommand {
  constructor({ userId, movieId, score, review }) {
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

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

    if (
      score === undefined ||
      score === null ||
      !Number.isInteger(Number(score)) ||
      Number(score) < 1 ||
      Number(score) > 5
    ) {
      throw new AppError(
        "score is required and must be an integer between 1 and 5",
        400,
      );
    }

    if (review !== undefined && review !== null) {
      if (typeof review !== "string" || review.trim().length === 0) {
        throw new AppError("review must be a non-empty string", 400);
      }
      if (review.trim().length > 1000) {
        throw new AppError("review must not exceed 1000 characters", 400);
      }
    }

    this.userId = Number(userId);
    this.movieId = Number(movieId);
    this.score = Number(score);
    this.review = review ? review.trim() : null;
  }
}

export default CreateRatingCommand;
