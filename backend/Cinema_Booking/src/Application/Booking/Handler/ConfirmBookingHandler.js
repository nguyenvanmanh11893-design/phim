import AppError from "../../../Domain/Errors/AppError.js";

// Booking confirmation must be the result of a verified payment.
class ConfirmBookingHandler {
  async execute() {
    throw new AppError("Xác nhận booking trực tiếp đã bị tắt. Vui lòng thanh toán qua POST /payments", 409);
  }
}
export default ConfirmBookingHandler;
