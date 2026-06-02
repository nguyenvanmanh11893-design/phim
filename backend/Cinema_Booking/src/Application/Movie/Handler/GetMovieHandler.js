// Application/Movie/Handler/GetMovieHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetMovieHandler {
  constructor(movieRepository) {
    this.movieRepository = movieRepository;
  }

  async execute(query) {
    const { id } = query;

    // ── Tìm phim theo id ───────────────────────────────────────────────
    const movie = await this.movieRepository.findById(id);

    if (!movie) {
      throw new AppError(`Movie với id=${id} không tồn tại`, 404);
    }

    return movie.toJSON();
  }
}

export default GetMovieHandler;
