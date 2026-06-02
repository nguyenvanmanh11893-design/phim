// src/Application/Ticket/Handler/GetTicketHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetTicketHandler {
  /**
   * @param {import('../../../Domain/Ticket/Repository/TicketRepositoryInterface.js').default} ticketRepository
   */
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(query) {
    const { bookingId, userId } = query;

    // ── Bước 1: Tìm vé trong hệ thống theo bookingId ──────────────────
    const ticket = await this.ticketRepository.findByBookingId(bookingId);

    // ── Bước 2: Kiểm tra tồn tại & Quyền sở hữu (Ownership) ───────────
    // Gộp chung điều kiện vé không tồn tại HOẶC vé thuộc về user khác
    // Trả về chung mã lỗi 404 Not Found để không leak thông tin vé của người khác
    if (!ticket || ticket.userId !== userId) {
      throw new AppError(`Không tìm thấy vé cho booking id=${bookingId}`, 404);
    }

    // ── Bước 3: Trả về kết quả ────────────────────────────────────────
    // Entity Ticket khi gọi toJSON() sẽ tự động ẩn các logic nội bộ và
    // trả về object sạch sẽ (gồm qrCode, isUsed, usedAt,...) cho client
    return ticket.toJSON();
  }
}

export default GetTicketHandler;
