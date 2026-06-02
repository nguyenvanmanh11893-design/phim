// src/Application/Booking/Handler/CancelBookingHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class CancelBookingHandler {
  /**
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default} bookingRepository
   */
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  async execute(command) {
    const { id, userId } = command;

    // ── Bước 1: Tìm booking — verify ownership trong cùng 1 query ─────
    // findByIdAndUserId() trả về null nếu:
    //   - booking không tồn tại
    //   - booking tồn tại nhưng không thuộc userId này
    // Không phân biệt 2 trường hợp — tránh leak thông tin
    const booking = await this.bookingRepository.findByIdAndUserId(id, userId);

    if (!booking) {
      throw new AppError(`Booking với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Gọi domain method — logic huỷ nằm trong Entity ────────
    // booking.cancel() tự throw nếu:
    //   - status = "CANCELLED" → đã huỷ trước đó
    //   - status = "CONFIRMED" → đã thanh toán, không huỷ trực tiếp
    try {
      booking.cancel();
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 3: Persist trạng thái mới vào DB ─────────────────────────
    // update() chỉ ghi status + cancelled_at — không đụng seats hay price
    const updatedBooking = await this.bookingRepository.update(booking);

    // ── Bước 4: Trả về kết quả ────────────────────────────────────────
    return {
      message: `Huỷ booking id=${id} thành công. Ghế đã được giải phóng.`,
      booking: updatedBooking.toJSON(),
    };
  }
}

export default CancelBookingHandler;
