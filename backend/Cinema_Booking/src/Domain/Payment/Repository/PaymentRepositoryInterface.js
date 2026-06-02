// Domain/Payment/Repository/PaymentRepositoryInterface.js
import AppError from "../../Errors/AppError.js";

/**
 * Interface định nghĩa contract cho tầng persistence của Payment.
 *
 * Tầng Domain không biết gì về MySQL —
 * MySQLPaymentRepository sẽ implement các method này.
 */
class PaymentRepositoryInterface {
  // ── Tìm kiếm ────────────────────────────────────────────────────────

  /**
   * Dùng trong GetPaymentHandler, ConfirmPaymentHandler.
   * Trả về Payment entity hoặc null.
   */
  async findById(id) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong GetPaymentHandler — verify ownership.
   * Tránh user A xem payment của user B.
   * Trả về Payment entity hoặc null.
   */
  async findByIdAndUserId(id, userId) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong InitiatePaymentHandler — kiểm tra booking đã có
   * payment PENDING đang hoạt động chưa.
   * Tránh tạo 2 session cho cùng 1 booking cùng lúc.
   * Trả về Payment entity hoặc null.
   */
  async findActiveByBookingId(bookingId) {
    throw new AppError("Not implemented", 500);
  }

  // ── Ghi dữ liệu ─────────────────────────────────────────────────────

  /**
   * Dùng trong InitiatePaymentHandler — insert payment session mới.
   * Trả về Payment entity với id thật từ AUTO_INCREMENT.
   */
  async save(payment) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Dùng trong ConfirmPaymentHandler (complete) và khi fail.
   * Chỉ update status, transactionId, paidAt.
   * Trả về Payment entity đã được cập nhật.
   */
  async update(payment) {
    throw new AppError("Not implemented", 500);
  }

  // ── Transaction support ──────────────────────────────────────────────

  /**
   * Dùng trong ConfirmPaymentHandler — cần update cả payment lẫn booking
   * trong cùng 1 transaction để đảm bảo atomicity.
   *
   * Cách dùng:
   *   await paymentRepository.withTransaction(async (conn) => {
   *     await paymentRepository.updateWithConn(payment, conn);
   *     await bookingRepository.updateWithConn(booking, conn);
   *   });
   */
  async withTransaction(fn) {
    throw new AppError("Not implemented", 500);
  }

  /**
   * Update payment trong 1 connection đã có transaction.
   * Nhận thêm `conn` thay vì tự lấy từ pool.
   */
  async updateWithConn(payment, conn) {
    throw new AppError("Not implemented", 500);
  }
}

export default PaymentRepositoryInterface;
