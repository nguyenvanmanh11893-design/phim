// Application/Payment/Command/ConfirmPaymentCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class ConfirmPaymentCommand {
  /**
   * Command dùng cho cả mock lẫn callback thật từ cổng TT.
   *
   * Mock: client tự gọi POST /payments/:id/confirm
   * Thật: VNPay/Momo gọi về IPN endpoint, controller parse rồi tạo command này
   *
   * transactionId:
   *   - Mock → controller tự sinh UUID trước khi tạo command
   *   - Thật → lấy từ payload của cổng TT
   */
  constructor({ id, transactionId }) {
    // ── id — payment session cần confirm ──────────────────────────────
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    // ── transactionId — bắt buộc, phải do controller truyền vào ───────
    // Không để handler tự sinh — handler không nên biết về UUID hay
    // format của từng cổng TT
    if (
      !transactionId ||
      typeof transactionId !== "string" ||
      transactionId.trim().length === 0
    ) {
      throw new AppError("transactionId is required and must be a string", 400);
    }

    this.id = Number(id);
    this.transactionId = transactionId.trim();
  }
}

export default ConfirmPaymentCommand;
