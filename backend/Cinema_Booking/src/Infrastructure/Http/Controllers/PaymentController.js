import InitiatePaymentCommand from "../../../Application/Payment/Command/InitiatePaymentCommand.js";
import ConfirmPaymentCommand from "../../../Application/Payment/Command/ConfirmPaymentCommand.js";
import FailPaymentCommand from "../../../Application/Payment/Command/FailPaymentCommand.js";
import GetPaymentQuery from "../../../Application/Payment/Query/GetPaymentQuery.js";
import AppError from "../../../Domain/Errors/AppError.js";
import { randomUUID } from "node:crypto";

class PaymentController {
  constructor(initiatePaymentHandler, confirmPaymentHandler, failPaymentHandler, getPaymentHandler,
    processVnpayHandler, vnpayService, vnpayRepository, config) {
    Object.assign(this, { initiatePaymentHandler, confirmPaymentHandler, failPaymentHandler, getPaymentHandler,
      processVnpayHandler, vnpayService, vnpayRepository, config });
  }
  async initiate(req, res, next) {
    try {
      const command = new InitiatePaymentCommand({ bookingId: Number(req.body?.bookingId),
        userId: req.user.userId, provider: req.body?.provider ?? this.config.PAYMENT_DEFAULT_PROVIDER });
      const result = await this.initiatePaymentHandler.execute(command, req.ip);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
  async get(req, res, next) {
    try {
      const result = await this.getPaymentHandler.execute(new GetPaymentQuery({
        id: Number(req.params.id), userId: req.user.userId }));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
  assertMockEnabled() {
    if (!this.config.PAYMENT_MOCK_ENABLED) throw new AppError("Thanh toán MOCK đã bị tắt", 403);
  }
  async confirm(req, res, next) {
    try {
      this.assertMockEnabled();
      const result = await this.confirmPaymentHandler.execute(new ConfirmPaymentCommand({
        id: Number(req.params.id), userId: req.user.userId, transactionId: randomUUID() }));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
  async fail(req, res, next) {
    try {
      this.assertMockEnabled();
      const result = await this.failPaymentHandler.execute(new FailPaymentCommand({
        id: Number(req.params.id), userId: req.user.userId }));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
  async vnpayIpn(req, res) {
    res.set("Cache-Control", "no-store");
    try {
      res.status(200).json(await this.processVnpayHandler.execute(req.query));
    } catch (error) {
      console.error("[VNPay IPN]", error.message);
      res.status(200).json({ RspCode: "99", Message: "Unable to process transaction" });
    }
  }
  async vnpayReturn(req, res, next) {
    try {
      res.set("Cache-Control", "no-store");
      const result = this.vnpayService.verify(req.query);
      if (!result) throw new AppError("Kết quả trả về từ VNPay không hợp lệ", 400);
      const payment = await this.vnpayRepository.findPayment(result.paymentId);
      if (!payment || result.amount !== Number(payment.amount) * 100) throw new AppError("Không tìm thấy giao dịch hợp lệ", 400);
      // Return never changes database state and never exposes financial details publicly.
      const data = { paymentId: result.paymentId, bookingId: Number(payment.booking_id),
        status: "PROCESSING", instructions: "Đăng nhập và gọi GET /payments/:id để đọc kết quả đã xác minh qua IPN" };
      if (!this.config.FRONTEND_URL) return res.json({ success: true, data });
      const base = new URL(this.config.FRONTEND_URL);
      if (base.protocol !== "https:" && !(this.config.NODE_ENV !== "production" &&
          base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) {
        throw new AppError("FRONTEND_URL không hợp lệ", 503);
      }
      const target = new URL(this.config.VNPAY_FRONTEND_RETURN_PATH, base);
      if (target.origin !== base.origin) throw new AppError("Đường dẫn kết quả phải thuộc FRONTEND_URL", 503);
      target.searchParams.set("paymentId", String(data.paymentId));
      target.searchParams.set("bookingId", String(data.bookingId));
      return res.redirect(303, target.toString());
    } catch (error) { next(error); }
  }
  async reviewRequired(req, res, next) {
    try {
      const page = req.query.page === undefined ? 1 : Number(req.query.page);
      const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
        throw new AppError("page phải >= 1; limit phải từ 1 đến 100", 400);
      }
      res.json({ success: true, data: await this.vnpayRepository.listReviewRequired({ page, limit }) });
    } catch (error) { next(error); }
  }
}
export default PaymentController;
