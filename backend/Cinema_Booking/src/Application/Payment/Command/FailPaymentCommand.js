// Application/Payment/Command/FailPaymentCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class FailPaymentCommand {
  /**
   * Dùng khi user huỷ ở trang thanh toán, hoặc cổng TT trả về lỗi.
   * Sau khi FAILED, booking vẫn PENDING — user có thể tạo payment session mới
   * nếu booking chưa hết hold.
   */
  constructor({ id }) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    this.id = Number(id);
  }
}

export default FailPaymentCommand;
