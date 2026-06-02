// src/Application/Ticket/Handler/IssueTicketHandler.js
import crypto from "crypto";
import AppError from "../../../Domain/Errors/AppError.js";
import Ticket from "../../../Domain/Ticket/Entity/Ticket.js";

class IssueTicketHandler {
  /**
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default} bookingRepository
   * @param {import('../../../Domain/Ticket/Repository/TicketRepositoryInterface.js').default} ticketRepository
   */
  constructor(bookingRepository, ticketRepository) {
    this.bookingRepository = bookingRepository;
    this.ticketRepository = ticketRepository;
  }

  async execute(command) {
    const { bookingId, userId } = command;

    // ── Bước 1: Tìm booking và xác thực quyền sở hữu (ownership) ──────
    // findByIdAndUserId() đảm bảo user chỉ có thể xuất vé cho booking của chính mình
    const booking = await this.bookingRepository.findByIdAndUserId(
      bookingId,
      userId,
    );

    if (!booking) {
      throw new AppError(`Booking với id=${bookingId} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra trạng thái booking ───────────────────────────
    // Vé điện tử chỉ được phát hành khi người dùng ĐÃ THANH TOÁN (CONFIRMED)
    if (booking.status !== "CONFIRMED") {
      throw new AppError(
        `Không thể phát hành vé: Booking đang ở trạng thái "${booking.status}". Yêu cầu trạng thái CONFIRMED.`,
        422,
      );
    }

    // ── Bước 3: Kiểm tra vé đã tồn tại chưa (Idempotency) ─────────────
    // Tránh trường hợp bị click đúp hoặc call API nhiều lần sinh ra nhiều vé
    const ticketExists =
      await this.ticketRepository.existsByBookingId(bookingId);

    if (ticketExists) {
      throw new AppError("Vé cho booking này đã được phát hành từ trước", 409);
    }

    // ── Bước 4: Sinh mã định danh cho QR Code ─────────────────────────
    // Tầng Domain chỉ cần lưu chuỗi string độc nhất. Việc chuyển đổi chuỗi
    // này thành hình ảnh mã QR vuông vuông sẽ do Frontend hoặc API Layer xử lý.
    const qrCode = crypto.randomUUID();

    // ── Bước 5: Tạo Entity Ticket ─────────────────────────────────────
    // Validation nghiệp vụ sẽ tự chạy trong constructor của Entity
    let ticket;
    try {
      ticket = Ticket.create({
        bookingId: booking.id,
        userId: booking.userId,
        showtimeId: booking.showtimeId,
        qrCode,
      });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 6: Lưu vé vào cơ sở dữ liệu ──────────────────────────────
    const savedTicket = await this.ticketRepository.save(ticket);

    // ── Bước 7: Trả về kết quả cho client ─────────────────────────────
    return {
      message: "Phát hành vé điện tử thành công",
      ticket: savedTicket.toJSON(),
    };
  }
}

export default IssueTicketHandler;
