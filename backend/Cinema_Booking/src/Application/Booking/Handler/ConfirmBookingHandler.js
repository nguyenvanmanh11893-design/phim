// src/Application/Booking/Handler/ConfirmBookingHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class ConfirmBookingHandler {
  /**
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default}   bookingRepository
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   */
  constructor(bookingRepository, showtimeRepository) {
    this.bookingRepository = bookingRepository;
    this.showtimeRepository = showtimeRepository;
  }

  async execute(command) {
    const { id, userId } = command;

    // ── Bước 1: Tìm booking — verify ownership ────────────────────────
    const booking = await this.bookingRepository.findByIdAndUserId(id, userId);

    if (!booking) {
      throw new AppError(`Booking với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra showtime còn bookable không ───────────────────
    // Edge case: showtime bị huỷ sau khi user tạo booking PENDING
    // Không muốn confirm một booking mà suất chiếu đã không còn hợp lệ
    const showtime = await this.showtimeRepository.findById(booking.showtimeId);

    if (!showtime || showtime.status === "CANCELLED") {
      throw new AppError(
        "Suất chiếu này đã bị huỷ, không thể xác nhận booking",
        422,
      );
    }

    // ── Bước 3: Gọi domain method — logic confirm nằm trong Entity ─────
    // booking.confirm() tự throw nếu:
    //   - status !== "PENDING"       → CONFIRMED/CANCELLED không confirm lại
    //   - isHoldExpired() === true   → quá 10 phút, ghế đã bị giải phóng
    try {
      booking.confirm();
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 4: Persist trạng thái mới ────────────────────────────────
    const updatedBooking = await this.bookingRepository.update(booking);

    // ── Bước 5: Trả về kết quả ────────────────────────────────────────
    return {
      message: "Thanh toán thành công. Vé đã được xác nhận.",
      booking: updatedBooking.toJSON(),
    };
  }
}

export default ConfirmBookingHandler;
