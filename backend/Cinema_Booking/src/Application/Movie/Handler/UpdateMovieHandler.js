// Application/Movie/Handler/UpdateMovieHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class UpdateMovieHandler {
  constructor(movieRepository) {
    this.movieRepository = movieRepository;
  }

  async execute(command) {
    const {
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
    } = command;

    // ── Bước 1: Fetch entity hiện tại từ DB ───────────────────────────
    const existing = await this.movieRepository.findById(id);

    if (!existing) {
      throw new AppError(`Movie với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Merge — chỉ ghi đè field được truyền vào ─────────────
    // undefined nghĩa là client không truyền field đó → giữ nguyên giá trị cũ
    // null nghĩa là client muốn xóa giá trị → cho phép ghi đè thành null
    existing.title = title !== undefined ? title : existing.title;
    existing.duration = duration !== undefined ? duration : existing.duration;
    existing.genres = genres !== undefined ? genres : existing.genres;
    existing.directors =
      directors !== undefined ? directors : existing.directors;
    existing.posterUrl =
      posterUrl !== undefined ? posterUrl : existing.posterUrl;
    existing.description =
      description !== undefined ? description : existing.description;
    existing.ageRating =
      ageRating !== undefined ? ageRating : existing.ageRating;
    existing.language = language !== undefined ? language : existing.language;
    existing.releaseDate =
      releaseDate !== undefined ? releaseDate : existing.releaseDate;
    existing.endDate = endDate !== undefined ? endDate : existing.endDate;

    // ── Bước 3: Validate nghiệp vụ sau merge ──────────────────────────
    // Command chỉ validate date khi cả 2 cùng được truyền vào.
    // Sau merge, entity luôn có đủ cả 2 → validate lại để chắc chắn
    // VD: DB có endDate=2025-01-01, client gửi releaseDate=2026-01-01
    //     → Command không bắt được vì endDate không được truyền
    //     → Phải validate lại ở đây sau khi merge
    if (
      existing.releaseDate &&
      existing.endDate &&
      existing.releaseDate > existing.endDate
    ) {
      throw new AppError("releaseDate phải nhỏ hơn endDate", 422);
    }

    // ── Bước 4: Lưu entity đã merge vào DB ────────────────────────────
    const updatedMovie = await this.movieRepository.update(existing);

    // ── Bước 5: Trả về JSON ───────────────────────────────────────────
    return updatedMovie.toJSON();
  }
}

export default UpdateMovieHandler;
