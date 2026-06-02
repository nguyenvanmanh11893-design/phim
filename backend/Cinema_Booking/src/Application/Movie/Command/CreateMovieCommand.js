import AppError from "../../../Domain/Errors/AppError.js";

class CreateMovieCommand {
  constructor({
    title,
    duration,
    genres,
    directors,
    releaseDate,
    endDate,
    posterUrl,
    description,
    ageRating,
    language,
  }) {
    // Required fields
    if (!title || typeof title !== "string") {
      throw new AppError("title is required and must be a string", 400);
    }
    if (!duration || !Number.isInteger(duration) || duration <= 0) {
      throw new AppError("duration must be a positive integer", 400);
    }
    if (!Array.isArray(genres) || genres.length === 0) {
      throw new AppError("genres must be a non-empty array", 400);
    }
    if (!Array.isArray(directors) || directors.length === 0) {
      throw new AppError("directors must be a non-empty array", 400);
    }
    if (!releaseDate) {
      throw new AppError("releaseDate is required", 400);
    }
    if (!endDate) {
      throw new AppError("endDate is required", 400);
    }

    // Optional fields - chỉ validate type
    if (posterUrl !== undefined && typeof posterUrl !== "string") {
      throw new AppError("posterUrl must be a string", 400);
    }
    if (description !== undefined && typeof description !== "string") {
      throw new AppError("description must be a string", 400);
    }

    // Enums validation
    const allowedAgeRatings = ["P", "K", "T13", "T16", "T18"];
    if (ageRating && !allowedAgeRatings.includes(ageRating)) {
      throw new AppError(
        `ageRating must be one of: ${allowedAgeRatings.join(", ")}`,
        400,
      );
    }

    const allowedLanguages = ["Vietsub", "Lồng tiếng", "Nguyên bản"];
    if (language && !allowedLanguages.includes(language)) {
      throw new AppError(
        `language must be one of: ${allowedLanguages.join(", ")}`,
        400,
      );
    }

    this.title = title;
    this.duration = duration;
    this.genres = genres;
    this.directors = directors;
    this.releaseDate = new Date(releaseDate);
    this.endDate = new Date(endDate);
    this.posterUrl = posterUrl || null;
    this.description = description || null;
    this.ageRating = ageRating || null;
    this.language = language || null;
  }
}

export default CreateMovieCommand;
