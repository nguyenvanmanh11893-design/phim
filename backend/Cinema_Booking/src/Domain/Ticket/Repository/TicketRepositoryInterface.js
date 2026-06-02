// src/Domain/Ticket/Repository/TicketRepositoryInterface.js
import AppError from "../../Errors/AppError.js";

class TicketRepositoryInterface {
  // Dùng trong IssueTicketHandler — lưu vé mới sau khi booking CONFIRMED
  async save(ticket) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong GetTicketHandler — user xem vé của mình theo bookingId
  // Trả về Ticket entity hoặc null
  async findByBookingId(bookingId) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong ValidateTicketHandler — staff quét QR, tìm vé theo chuỗi QR
  // Trả về Ticket entity hoặc null
  async findByQrCode(qrCode) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong ValidateTicketHandler — persist isUsed + usedAt sau khi quét
  async update(ticket) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong IssueTicketHandler — kiểm tra booking này đã có vé chưa
  // tránh phát hành trùng vé nếu endpoint bị gọi 2 lần
  async existsByBookingId(bookingId) {
    throw new AppError("Not implemented", 500);
  }
}

export default TicketRepositoryInterface;
