// src/Application/Booking/Handler/GetBookingHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetBookingHandler {
  /**
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default}   bookingRepository
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   */
  constructor(bookingRepository, showtimeRepository) {
    this.bookingRepository = bookingRepository;
    this.showtimeRepository = showtimeRepository;
  }

  async execute(query) {
    const { id, userId } = query;

    // ── Bước 1: Tìm booking — verify ownership trong cùng 1 query ─────
    // findByIdAndUserId() trả về null nếu booking không tồn tại
    // HOẶC không thuộc về userId này
    // Không phân biệt 2 trường hợp — tránh leak thông tin booking tồn tại
    const booking = await this.bookingRepository.findByIdAndUserId(id, userId);

    if (!booking) {
      throw new AppError(`Booking với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Lấy thông tin showtime kèm chi tiết ───────────────────
    // findByIdWithDetails() JOIN movie + room + cinema trong 1 query
    // Client cần biết xem phim gì, rạp nào, giờ nào — không muốn gọi thêm API
    const showtimeResult = await this.showtimeRepository.findByIdWithDetails(
      booking.showtimeId,
    );

    // Showtime bị xóa khỏi DB là edge case hiếm gặp — vẫn trả về booking
    // nhưng không có thông tin showtime chi tiết
    const showtimeData = showtimeResult
      ? {
          ...showtimeResult.showtime.toJSON(),
          movie: showtimeResult.movie.toJSON(),
          room: showtimeResult.room.toJSON(),
          cinema: {
            id: showtimeResult.cinema.id,
            name: showtimeResult.cinema.name,
            city: showtimeResult.cinema.city,
          },
        }
      : null;

    // ── Bước 3: Trả về đầy đủ thông tin ──────────────────────────────
    return {
      ...booking.toJSON(),
      showtime: showtimeData,
    };
  }
}

export default GetBookingHandler;
