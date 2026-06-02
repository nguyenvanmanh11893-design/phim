// Application/Movie/Handler/DeleteMovieHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class DeleteMovieHandler {
  constructor(movieRepository) {
    this.movieRepository = movieRepository;
  }

  async execute(command) {
    const { id } = command;

    // ── Bước 1: Kiểm tra tồn tại ──────────────────────────────────────
    const exists = await this.movieRepository.existsById(id);

    if (!exists) {
      throw new AppError(`Movie với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Xóa ───────────────────────────────────────────────────
    await this.movieRepository.delete(id);

    return { message: `Xóa phim id=${id} thành công` };
  }
}

export default DeleteMovieHandler;
