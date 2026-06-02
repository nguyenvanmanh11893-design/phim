// Application/Showtime/Handler/CreateShowtimeHandler.js
import AppError from "../../../Domain/Errors/AppError.js";
import Showtime from "../../../Domain/Showtime/Entity/Showtime.js";

class CreateShowtimeHandler {
  /**
   * @param {import('../../../Domain/Movie/Repository/MovieRepositoryInterface.js').default}    movieRepository
   * @param {import('../../../Domain/Cinema/Repository/RoomRepositoryInterface.js').default}    roomRepository
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   */
  constructor(movieRepository, roomRepository, showtimeRepository) {
    this.movieRepository = movieRepository;
    this.roomRepository = roomRepository;
    this.showtimeRepository = showtimeRepository;
  }

  async execute(command) {
    const { movieId, roomId, startTime, basePrice, vipPrice, couplePrice } =
      command;

    // ── Bước 1: Verify phim tồn tại và còn được phép tạo suất chiếu ──
    // isAcceptingShowtimes() = status !== "ended"
    // Phim đã kết thúc chiếu rạp thì không cho tạo suất mới
    const movie = await this.movieRepository.findById(movieId);

    if (!movie) {
      throw new AppError(`Movie với id=${movieId} không tồn tại`, 404);
    }

    if (!movie.isAcceptingShowtimes()) {
      throw new AppError(
        `Phim "${movie.title}" đã kết thúc, không thể tạo suất chiếu mới`,
        422,
      );
    }

    // ── Bước 2: Verify phòng tồn tại, lấy kèm cinema để trả về ───────
    // findByIdWithCinema() dùng JOIN — 1 query thay vì 2
    const roomResult = await this.roomRepository.findByIdWithCinema(roomId);

    if (!roomResult) {
      throw new AppError(`Room với id=${roomId} không tồn tại`, 404);
    }

    const { room, cinema } = roomResult;

    // ── Bước 3: Tính endTime từ duration của phim ─────────────────────
    // endTime không để client tự truyền — tránh endTime sai với độ dài phim
    // Thêm 15 phút buffer cho quảng cáo + dọn phòng giữa các suất
    const BUFFER_MINUTES = 15;
    const durationMinutes = movie.duration + BUFFER_MINUTES;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // ── Bước 4: Kiểm tra conflict lịch phòng ─────────────────────────
    // Một phòng không thể có 2 suất chiếu trùng khung giờ
    // findConflicting() chỉ tìm suất chưa bị huỷ (cancelled_at IS NULL)
    const conflicts = await this.showtimeRepository.findConflicting({
      roomId,
      startTime,
      endTime,
      excludeId: null,
    });

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      throw new AppError(
        `Phòng đã có suất chiếu từ ${conflict.startTime.toLocaleString("vi-VN")} ` +
          `đến ${conflict.endTime.toLocaleString("vi-VN")}`,
        409,
      );
    }

    // ── Bước 5: Tạo Showtime entity ───────────────────────────────────
    // Validation nghiệp vụ nằm trong constructor của Entity
    let showtime;
    try {
      showtime = Showtime.create({
        movieId,
        roomId,
        startTime,
        durationMinutes,
        basePrice,
        vipPrice,
        couplePrice,
      });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 6: Lưu vào DB ────────────────────────────────────────────
    const savedShowtime = await this.showtimeRepository.save(showtime);

    // ── Bước 7: Trả về đầy đủ thông tin — client không cần query thêm ─
    return {
      ...savedShowtime.toJSON(),
      movie: movie.toJSON(),
      room: room.toJSON(),
      cinema: {
        id: cinema.id,
        name: cinema.name,
        city: cinema.city,
      },
    };
  }
}

export default CreateShowtimeHandler;
