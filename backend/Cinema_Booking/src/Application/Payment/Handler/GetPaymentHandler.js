// Application/Payment/Handler/GetPaymentHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetPaymentHandler {
  /**
   * @param {import('../../../Domain/Payment/Repository/PaymentRepositoryInterface.js').default} paymentRepository
   */
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
  }

  async execute(query) {
    const { id, userId } = query;

    // ── Verify ownership trong cùng 1 query ───────────────────────────
    // Tránh user A xem payment của user B
    const payment = await this.paymentRepository.findByIdAndUserId(id, userId);

    if (!payment) {
      throw new AppError(`Payment với id=${id} không tồn tại`, 404);
    }

    return payment.toJSON();
  }
}

export default GetPaymentHandler;
