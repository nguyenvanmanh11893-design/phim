// Application/Payment/Handler/InitiatePaymentHandler.js
import AppError from "../../../Domain/Errors/AppError.js";
import Payment from "../../../Domain/Payment/Entity/Payment.js";

class InitiatePaymentHandler {
  /**
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default}  bookingRepository
   * @param {import('../../../Domain/Payment/Repository/PaymentRepositoryInterface.js').default}  paymentRepository
   */
  constructor(bookingRepository, paymentRepository) {
    this.bookingRepository = bookingRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(command) {
    const { bookingId, userId, provider } = command;

    // ── Bước 1: Verify booking tồn tại và thuộc đúng user ─────────────
    // findByIdAndUserId() trả về null nếu không tồn tại hoặc sai owner
    // Không phân biệt 2 trường hợp — tránh leak thông tin
    const booking = await this.bookingRepository.findByIdAndUserId(
      bookingId,
      userId,
    );

    if (!booking) {
      throw new AppError(`Booking với id=${bookingId} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra booking còn có thể thanh toán không ──────────
    // Chỉ PENDING mới được tạo payment session
    if (booking.status !== "PENDING") {
      throw new AppError(
        `Booking đã ở trạng thái "${booking.status}", không thể thanh toán`,
        422,
      );
    }

    // Hold hết hạn → ghế đã bị giải phóng, không cho thanh toán nữa
    if (booking.isHoldExpired()) {
      throw new AppError(
        "Booking đã hết thời gian giữ ghế. Vui lòng đặt lại.",
        422,
      );
    }

    // ── Bước 3: Kiểm tra đã có payment session đang hoạt động chưa ────
    // Tránh tạo nhiều session cho cùng 1 booking cùng lúc
    // Nếu đã có PENDING chưa hết hạn → trả về session cũ, không tạo mới
    const existingPayment =
      await this.paymentRepository.findActiveByBookingId(bookingId);

    if (existingPayment) {
      return this.#buildResponse(existingPayment);
    }

    // ── Bước 4: Tạo Payment entity ────────────────────────────────────
    let payment;
    try {
      payment = Payment.create({
        bookingId,
        userId,
        amount: booking.totalPrice,
        provider,
      });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 5: Lưu vào DB ────────────────────────────────────────────
    const savedPayment = await this.paymentRepository.save(payment);

    // ── Bước 6: Trả về payment session + hướng dẫn tiếp theo ──────────
    return this.#buildResponse(savedPayment);
  }

  // ── Private helper — build response nhất quán dù session mới hay cũ ─
  #buildResponse(payment) {
    return {
      ...payment.toJSON(),
      // paymentUrl là endpoint giả — client gọi vào đây để "hoàn tất" TT
      // Khi tích hợp VNPay thật: trả về URL redirect của VNPay thay thế
      paymentUrl:
        payment.provider === "MOCK"
          ? `/payments/${payment.id}/mock-checkout`
          : null, // URL thật sẽ được sinh bởi VNPay SDK ở Infrastructure layer
      instructions:
        payment.provider === "MOCK"
          ? `Gọi POST /payments/${payment.id}/confirm để giả lập thanh toán thành công`
          : "Redirect user đến paymentUrl để hoàn tất thanh toán",
    };
  }
}

export default InitiatePaymentHandler;
