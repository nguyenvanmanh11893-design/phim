// Application/Showtime/Handler/GetShowtimeHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetShowtimeHandler {
  /**
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   */
  constructor(showtimeRepository) {
    this.showtimeRepository = showtimeRepository;
  }

  async execute(query) {
    const { id } = query;

    // ── findByIdWithDetails() — JOIN movie + room + cinema trong 1 query ─
    // Trang chi tiết suất chiếu cần hiển thị tên phim, tên phòng, tên rạp
    // → không muốn client phải gọi thêm 3 API khác
    const result = await this.showtimeRepository.findByIdWithDetails(id);

    if (!result) {
      throw new AppError(`Showtime với id=${id} không tồn tại`, 404);
    }

    const { showtime, movie, room, cinema } = result;

    return {
      ...showtime.toJSON(),
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

export default GetShowtimeHandler;
