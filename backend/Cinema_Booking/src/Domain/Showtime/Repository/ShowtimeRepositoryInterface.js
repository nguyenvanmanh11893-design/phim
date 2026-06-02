// Domain/Showtime/Repository/ShowtimeRepositoryInterface.js
import AppError from "../../Errors/AppError.js";

/**
 * Interface định nghĩa contract cho tầng persistence của Showtime.
 *
 * Tầng Domain không biết gì về MySQL hay bất kỳ DB nào —
 * tầng Infrastructure (MySQLShowtimeRepository) sẽ implement các method này.
 */
class ShowtimeRepositoryInterface {
  // ── Tìm kiếm đơn lẻ ─────────────────────────────────────────────────

  /**
   * Dùng trong GetShowtimeHandler, BookingHandler
   * Trả về Showtime entity hoặc null nếu không tồn tại
   */
  async findById(id) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong GetShowtimeHandler (public) và BookingHandler —
   * cần thông tin phim + phòng + rạp kèm theo suất chiếu để trả về 1 lần,
   * tránh query thêm nhiều lần ở Handler.
   * Trả về { showtime, movie, room, cinema } hoặc null.
   */
  async findByIdWithDetails(id) {
    throw new AppError("Not implemented", 500);
  }

  // ── Tìm kiếm danh sách ───────────────────────────────────────────────

  /**
   * Dùng trong ListShowtimesHandler (public) — lấy lịch chiếu theo ngày.
   *
   * @param {object} filters
   * @param {number|null}  filters.movieId   — lọc theo phim
   * @param {number|null}  filters.cinemaId  — lọc theo rạp
   * @param {Date|null}    filters.date      — lọc theo ngày (so sánh DATE(start_time))
   * @param {string|null}  filters.status    — "SCHEDULED" | "ONGOING" | "ENDED" | "CANCELLED"
   * @param {number}       filters.page
   * @param {number}       filters.limit
   *
   * Trả về { data: Showtime[], total, page, limit, totalPages }
   */
  async findAll({ movieId, cinemaId, date, status, page, limit }) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong CreateShowtimeHandler để kiểm tra conflict lịch chiếu —
   * một phòng không thể chiếu 2 suất trùng nhau.
   *
   * Logic: tìm các suất chiếu của roomId mà khoảng [startTime, endTime]
   * bị overlap với khoảng đang muốn tạo, bỏ qua excludeId (dùng khi update).
   *
   * @returns {Showtime[]} — mảng rỗng nếu không có conflict
   */
  async findConflicting({ roomId, startTime, endTime, excludeId }) {
    throw new AppError("Not implemented", 500);
  }

  // ── Ghi dữ liệu ─────────────────────────────────────────────────────

  /**
   * Dùng trong CreateShowtimeHandler — insert suất chiếu mới.
   * Trả về Showtime entity với id thật từ AUTO_INCREMENT.
   */
  async save(showtime) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong CancelShowtimeHandler — update cancelled_at.
   * Chỉ update field cancelledAt, không update giá hay giờ chiếu.
   * Trả về Showtime entity đã được cập nhật.
   */
  async update(showtime) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Cập nhật thông tin chi tiết của suất chiếu (phòng, giờ chiếu, giá vé)
   * @param {Showtime} showtime - Đối tượng Showtime với các dữ liệu mới
   * @returns {Promise<Showtime>}
   */
  async updateDetails(showtime) {
    throw new AppError("Not implemented", 500);
  }

  // ── Kiểm tra tồn tại ─────────────────────────────────────────────────

  /**
   * Dùng trong CancelShowtimeHandler — kiểm tra nhẹ, không fetch toàn bộ row.
   */
  async existsById(id) {
    throw new AppError("Not implemented", 500);
  }

  // ── Kiểm tra ràng buộc nghiệp vụ ─────────────────────────────────────

  /**
   * Kiểm tra xem suất chiếu đã có bất kỳ vé nào được đặt chưa (PENDING hoặc CONFIRMED).
   * Dùng trong UpdateShowtimeHandler để chặn việc đổi giờ/giá khi đã có người mua.
   * * @param {number} id - ID của suất chiếu
   * @returns {Promise<boolean>}
   */
  async hasBookings(id) {
    throw new AppError("Not implemented", 500);
  }
}

export default ShowtimeRepositoryInterface;
