// src/Application/Rating/Handler/CreateRatingHandler.js
import AppError from "../../../Domain/Errors/AppError.js";
import Rating from "../../../Domain/Rating/Entity/Rating.js";

class CreateRatingHandler {
  /**
   * @param {import('../../../Domain/Rating/Repository/RatingRepositoryInterface.js').default}   ratingRepository
   * @param {import('../../../Domain/Movie/Repository/MovieRepositoryInterface.js').default}     movieRepository
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default} bookingRepository
   */
  constructor(ratingRepository, movieRepository, bookingRepository) {
    this.ratingRepository = ratingRepository;
    this.movieRepository = movieRepository;
    this.bookingRepository = bookingRepository;
  }

  async execute(command) {
    const { userId, movieId, score, review } = command;

    // ── Bước 1: Kiểm tra phim tồn tại ────────────────────────────────
    const movie = await this.movieRepository.findById(movieId);

    if (!movie) {
      throw new AppError(`Movie với id=${movieId} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra user đã xem phim chưa ───────────────────────
    // Chỉ cho phép rate nếu có ít nhất 1 booking CONFIRMED
    // cho showtime thuộc movieId này — tránh fake review
    const hasWatched =
      await this.bookingRepository.existsConfirmedByUserIdAndMovieId(
        userId,
        movieId,
      );

    if (!hasWatched) {
      throw new AppError("Bạn chỉ có thể đánh giá phim sau khi đã xem", 403);
    }

    // ── Bước 3: Kiểm tra user đã rate phim này chưa ───────────────────
    // Mỗi user chỉ được rate 1 lần — UNIQUE KEY (user_id, movie_id) trong DB
    const alreadyRated = await this.ratingRepository.existsByUserIdAndMovieId(
      userId,
      movieId,
    );

    if (alreadyRated) {
      throw new AppError("Bạn đã đánh giá phim này rồi", 409);
    }

    // ── Bước 4: Tạo Rating entity ─────────────────────────────────────
    let rating;
    try {
      rating = Rating.create({ userId, movieId, score, review });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 5: Lưu vào DB ────────────────────────────────────────────
    const savedRating = await this.ratingRepository.save(rating);

    return savedRating.toJSON();
  }
}

export default CreateRatingHandler;
