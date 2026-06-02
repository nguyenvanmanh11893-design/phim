// src/Application/Payment/Handler/ConfirmPaymentHandler.js
import AppError from "../../../Domain/Errors/AppError.js";
import IssueTicketCommand from "../../Ticket/Command/IssueTicketCommand.js"; // Import thêm Command

class ConfirmPaymentHandler {
  /**
   * @param {import('../../../Domain/Payment/Repository/PaymentRepositoryInterface.js').default}  paymentRepository
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default}  bookingRepository
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   * @param {import('../../Ticket/Handler/IssueTicketHandler.js').default} issueTicketHandler
   */
  constructor(
    paymentRepository,
    bookingRepository,
    showtimeRepository,
    issueTicketHandler,
    userRepository,
    emailService,
  ) {
    this.paymentRepository = paymentRepository;
    this.bookingRepository = bookingRepository;
    this.showtimeRepository = showtimeRepository;
    this.issueTicketHandler = issueTicketHandler; // Tích hợp thêm handler
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async execute(command) {
    const { id, transactionId } = command;

    // ── Bước 1: Tìm payment session ───────────────────────────────────
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new AppError(`Payment với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra payment còn có thể complete không ────────────
    if (!payment.isPayable()) {
      const reason = payment.isExpired()
        ? "phiên thanh toán đã hết hạn"
        : `trạng thái hiện tại là "${payment.status}"`;
      throw new AppError(`Không thể xác nhận thanh toán: ${reason}`, 422);
    }

    // ── Bước 3: Tìm booking tương ứng ─────────────────────────────────
    const booking = await this.bookingRepository.findById(payment.bookingId);

    if (!booking) {
      throw new AppError(
        `Booking với id=${payment.bookingId} không tồn tại`,
        404,
      );
    }

    // ── Bước 4: Kiểm tra booking vẫn còn confirmable không ────────────
    if (!booking.isConfirmable()) {
      payment.fail();
      await this.paymentRepository.update(payment);

      throw new AppError(
        "Booking đã hết thời gian giữ ghế trong lúc thanh toán. Vui lòng đặt lại.",
        422,
      );
    }

    // ── Bước 5: Kiểm tra showtime chưa bị huỷ ────────────────────────
    const showtime = await this.showtimeRepository.findById(booking.showtimeId);

    if (!showtime || showtime.status === "CANCELLED") {
      payment.fail();
      await this.paymentRepository.update(payment);

      throw new AppError(
        "Suất chiếu này đã bị huỷ. Vui lòng liên hệ để được hoàn tiền.",
        422,
      );
    }

    // ── Bước 6: Gọi domain methods — mutation nằm trong Entity ────────
    try {
      payment.complete(transactionId);
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    try {
      booking.confirm();
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 7: Persist cả 2 trong 1 transaction ─────────────────────
    await this.paymentRepository.withTransaction(async (conn) => {
      await this.paymentRepository.updateWithConn(payment, conn);
      await this.bookingRepository.updateWithConn(booking, conn);
    });

    // ── Bước 8: Tự động phát hành vé điện tử (Issue Ticket) ───────────
    let ticketResult = null;
    try {
      const issueCommand = new IssueTicketCommand({
        bookingId: booking.id,
        userId: booking.userId,
      });
      // Gọi sang IssueTicketHandler để sinh vé và lưu xuống DB
      ticketResult = await this.issueTicketHandler.execute(issueCommand);
    } catch (err) {
      // Bắt try-catch ở đây để nếu tiến trình sinh vé lỗi (VD: đứt mạng DB cục bộ)
      // thì user vẫn nhận được thông báo "Thanh toán thành công", không làm crash API
      console.error(
        "[IssueTicketError] Lỗi khi phát hành vé tự động:",
        err.message,
      );
    }

    // ── Bước 8.5: Gửi Email thông báo (Bọc trong try-catch để API không bị crash) ──
    try {
      const user = await this.userRepository.findById(booking.userId);
      if (user && user.email) {
        await this.emailService.sendBookingConfirmation(
          user.email.value,
          booking.toJSON(),
          showtime.toJSON(),
          ticketResult ? ticketResult.ticket : null,
        );
      }
    } catch (err) {
      console.error(
        "[SendEmailError] Lỗi khi gửi email xác nhận:",
        err.message,
      );
    }

    // ── Bước 9: Trả về kết quả ────────────────────────────────────────
    return {
      message: "Thanh toán thành công. Vé đã được phát hành.",
      payment: payment.toJSON(),
      booking: booking.toJSON(),
      ticket: ticketResult ? ticketResult.ticket : null, // Kèm luôn dữ liệu vé trả về client
    };
  }
}

export default ConfirmPaymentHandler;
