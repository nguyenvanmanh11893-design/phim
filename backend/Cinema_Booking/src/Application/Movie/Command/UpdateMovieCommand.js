import AppError from "../../../Domain/Errors/AppError.js";

class UpdateMovieCommand {
  constructor({
    id,
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
    // ── id là bắt buộc — không có id thì không biết update cái nào ──
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    // ── Kiểm tra có ít nhất 1 field được truyền vào để update ────────
    const updatableFields = [
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
    ];
    const hasAtLeastOneField = updatableFields.some((f) => f !== undefined);
    if (!hasAtLeastOneField) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    // ── Validate từng field nếu được truyền vào (partial update) ─────

    if (title !== undefined) {
      if (!title || typeof title !== "string") {
        throw new AppError("title must be a non-empty string", 400);
      }
    }

    if (duration !== undefined) {
      if (!Number.isInteger(duration) || duration <= 0) {
        throw new AppError("duration must be a positive integer", 400);
      }
    }

    if (genres !== undefined) {
      if (!Array.isArray(genres) || genres.length === 0) {
        throw new AppError("genres must be a non-empty array", 400);
      }
    }

    if (directors !== undefined) {
      if (!Array.isArray(directors) || directors.length === 0) {
        throw new AppError("directors must be a non-empty array", 400);
      }
    }

    if (posterUrl !== undefined && typeof posterUrl !== "string") {
      throw new AppError("posterUrl must be a string", 400);
    }

    if (description !== undefined && typeof description !== "string") {
      throw new AppError("description must be a string", 400);
    }

    const allowedAgeRatings = ["P", "K", "T13", "T16", "T18"];
    if (ageRating !== undefined && !allowedAgeRatings.includes(ageRating)) {
      throw new AppError(
        `ageRating must be one of: ${allowedAgeRatings.join(", ")}`,
        400,
      );
    }

    const allowedLanguages = ["Vietsub", "Lồng tiếng", "Nguyên bản"];
    if (language !== undefined && !allowedLanguages.includes(language)) {
      throw new AppError(
        `language must be one of: ${allowedLanguages.join(", ")}`,
        400,
      );
    }

    // ── Validate date logic nếu cả 2 cùng được truyền vào ────────────
    // Nếu chỉ truyền 1 trong 2, bỏ qua — Handler sẽ merge với data hiện tại
    if (releaseDate !== undefined && endDate !== undefined) {
      const release = new Date(releaseDate);
      const end = new Date(endDate);
      if (isNaN(release.getTime())) {
        throw new AppError("releaseDate is not a valid date", 400);
      }
      if (isNaN(end.getTime())) {
        throw new AppError("endDate is not a valid date", 400);
      }
      if (release > end) {
        throw new AppError("releaseDate must be before endDate", 400);
      }
    } else {
      if (releaseDate !== undefined && isNaN(new Date(releaseDate).getTime())) {
        throw new AppError("releaseDate is not a valid date", 400);
      }
      if (endDate !== undefined && isNaN(new Date(endDate).getTime())) {
        throw new AppError("endDate is not a valid date", 400);
      }
    }

    // ── Gán giá trị ──────────────────────────────────────────────────
    this.id = Number(id);
    this.title = title;
    this.duration = duration;
    this.genres = genres;
    this.directors = directors;
    this.releaseDate =
      releaseDate !== undefined ? new Date(releaseDate) : undefined;
    this.endDate = endDate !== undefined ? new Date(endDate) : undefined;
    this.posterUrl = posterUrl;
    this.description = description;
    this.ageRating = ageRating;
    this.language = language;
  }
}

export default UpdateMovieCommand;
