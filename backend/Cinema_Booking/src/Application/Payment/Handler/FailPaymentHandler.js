// Application/Payment/Handler/FailPaymentHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class FailPaymentHandler {
  /**
   * @param {import('../../../Domain/Payment/Repository/PaymentRepositoryInterface.js').default} paymentRepository
   */
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
  }

  async execute(command) {
    const { id } = command;

    // ── Bước 1: Tìm payment session ───────────────────────────────────
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new AppError(`Payment với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Gọi domain method ─────────────────────────────────────
    // payment.fail() tự throw nếu status không phải PENDING
    // SUCCESS đã xong rồi, FAILED thì không fail lại
    try {
      payment.fail();
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 3: Persist ───────────────────────────────────────────────
    // Booking KHÔNG bị đổi status ở đây — vẫn giữ PENDING
    // User còn trong thời gian hold có thể tạo payment session mới
    const updatedPayment = await this.paymentRepository.update(payment);

    return {
      message:
        "Phiên thanh toán đã bị huỷ. Booking vẫn được giữ nếu còn trong thời hạn.",
      payment: updatedPayment.toJSON(),
    };
  }
}

export default FailPaymentHandler;
