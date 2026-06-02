// Application/Movie/Handler/CreateMovieHandler.js
import Movie from "../../../Domain/Movie/Entity/Movie.js";
import AppError from "../../../Domain/Errors/AppError.js";

class CreateMovieHandler {
  constructor(movieRepository) {
    this.movieRepository = movieRepository;
  }

  async execute(command) {
    const {
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
    } = command;

    // ── Bước 1: Tạo Movie entity — validation nghiệp vụ nằm trong constructor ──
    // Movie.create() sẽ throw nếu:
    //   - title rỗng
    //   - duration không phải số nguyên dương
    //   - releaseDate > endDate
    let movie;
    try {
      movie = Movie.create({
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
      });
    } catch (err) {
      // Wrap lỗi từ Entity thành AppError để errorMiddleware xử lý đúng
      throw new AppError(err.message, 422);
    }

    // ── Bước 2: Lưu vào DB ────────────────────────────────────────────
    const savedMovie = await this.movieRepository.save(movie);

    // ── Bước 3: Trả về JSON — không expose internal entity object ─────
    return savedMovie.toJSON();
  }
}

export default CreateMovieHandler;
