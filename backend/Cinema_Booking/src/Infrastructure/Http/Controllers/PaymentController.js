// Infrastructure/Http/Controllers/PaymentController.js
import InitiatePaymentCommand from "../../../Application/Payment/Command/InitiatePaymentCommand.js";
import ConfirmPaymentCommand from "../../../Application/Payment/Command/ConfirmPaymentCommand.js";
import FailPaymentCommand from "../../../Application/Payment/Command/FailPaymentCommand.js";
import GetPaymentQuery from "../../../Application/Payment/Query/GetPaymentQuery.js";
import { randomUUID } from "crypto";

class PaymentController {
  constructor(
    initiatePaymentHandler,
    confirmPaymentHandler,
    failPaymentHandler,
    getPaymentHandler,
  ) {
    this.initiatePaymentHandler = initiatePaymentHandler;
    this.confirmPaymentHandler = confirmPaymentHandler;
    this.failPaymentHandler = failPaymentHandler;
    this.getPaymentHandler = getPaymentHandler;
  }

  // POST /payments
  async initiate(req, res, next) {
    try {
      const command = new InitiatePaymentCommand({
        bookingId: Number(req.body.bookingId),
        userId: req.user.userId, // từ JWT, không lấy từ body
        provider: req.body.provider, // optional, mặc định "MOCK"
      });

      const result = await this.initiatePaymentHandler.execute(command);

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /payments/:id
  async get(req, res, next) {
    try {
      const query = new GetPaymentQuery({
        id: Number(req.params.id),
        userId: req.user.userId,
      });

      const result = await this.getPaymentHandler.execute(query);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /payments/:id/confirm
  // Mock endpoint — giả lập callback từ cổng TT
  // Khi dùng VNPay thật: tạo thêm POST /payments/vnpay-callback riêng,
  // parse IPN payload của VNPay rồi gọi cùng ConfirmPaymentHandler
  async confirm(req, res, next) {
    try {
      // Controller tự sinh transactionId cho mock
      // VNPay thật: lấy từ req.body (vnp_TransactionNo hoặc tương đương)
      const transactionId = randomUUID();

      const command = new ConfirmPaymentCommand({
        id: Number(req.params.id),
        transactionId,
      });

      const result = await this.confirmPaymentHandler.execute(command);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /payments/:id/fail
  // Mock endpoint — giả lập user huỷ ở trang TT hoặc cổng TT báo lỗi
  async fail(req, res, next) {
    try {
      const command = new FailPaymentCommand({
        id: Number(req.params.id),
      });

      const result = await this.failPaymentHandler.execute(command);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default PaymentController;
