// src/Domain/Booking/Repository/BookingRepositoryInterface.js
import AppError from "../../Errors/AppError.js";

/**
 * Interface định nghĩa contract cho tầng persistence của Booking.
 *
 * Tầng Domain không biết gì về MySQL —
 * MySQLBookingRepository sẽ implement các method này.
 */
class BookingRepositoryInterface {
  // ── Tìm kiếm đơn lẻ ─────────────────────────────────────────────────

  /**
   * Dùng trong GetBookingHandler, ConfirmBookingHandler, CancelBookingHandler.
   * Trả về Booking entity kèm seats, hoặc null nếu không tồn tại.
   */
  async findById(id) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong GetBookingHandler (user xem chi tiết vé của mình) —
   * verify booking có thuộc về user đang gọi không.
   * Trả về Booking entity hoặc null.
   */
  async findByIdAndUserId(id, userId) {
    throw new AppError("Not implemented", 500);
  }

  // ── Tìm kiếm danh sách ───────────────────────────────────────────────

  /**
   * Dùng trong ListBookingsHandler — lấy lịch sử đặt vé của 1 user.
   *
   * @param {number} userId
   * @param {object} options
   * @param {number} options.page
   * @param {number} options.limit
   *
   * Trả về { data: Booking[], total, page, limit, totalPages }
   */
  async findByUserId(userId, { page, limit, status }) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng cho Admin xem tất cả booking
   * Trả về { data: Booking[], total, page, limit, totalPages }
   */
  async findAll({ page, limit, status, userId }) {
    throw new AppError("Not implemented", 500);
  }

  // ── Query phục vụ seat map ────────────────────────────────────────────

  /**
   * Dùng trong GetSeatMapForShowtimeHandler — biết ghế nào đã bị chiếm.
   *
   * "Occupied" = CONFIRMED + PENDING còn trong thời gian hold:
   *   status = 'CONFIRMED'
   *   OR (status = 'PENDING' AND held_until > NOW())
   *
   * CANCELLED và PENDING hết hạn không tính — ghế đó coi như trống.
   *
   * @param {number} showtimeId
   * @returns {number[]} mảng seatId đang bị chiếm
   */
  async findOccupiedSeatIdsByShowtimeId(showtimeId) {
    throw new AppError("Not implemented", 500);
  }

  // ── Ghi dữ liệu ─────────────────────────────────────────────────────

  /**
   * Dùng trong CreateBookingHandler — insert booking + booking_seats
   * trong cùng 1 transaction.
   * Trả về Booking entity với id thật từ AUTO_INCREMENT, kèm seats đã có id.
   */
  async save(booking) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong ConfirmBookingHandler (sau payment) và CancelBookingHandler.
   * Chỉ update status, confirmed_at, cancelled_at — không update seats hay price.
   * Trả về Booking entity đã được cập nhật.
   */
  async update(booking) {
    throw new AppError("Not implemented", 500);
  }

  // ── Kiểm tra tồn tại ─────────────────────────────────────────────────

  /**
   * Dùng trong CancelBookingHandler — kiểm tra nhẹ trước khi fetch toàn bộ.
   */
  async existsById(id) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateRatingHandler — verify user đã xem phim trước khi cho rate
  async existsConfirmedByUserIdAndMovieId(userId, movieId) {
    throw new AppError("Not implemented", 500);
  }

  async updateWithConn(booking, conn) {
    throw new AppError("Not implemented", 500);
  }
}

export default BookingRepositoryInterface;
