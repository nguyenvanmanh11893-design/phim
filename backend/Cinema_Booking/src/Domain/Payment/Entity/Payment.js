// Domain/Payment/Entity/Payment.js

/**
 * Payment — đại diện cho 1 phiên thanh toán gắn với 1 Booking.
 *
 * Quan hệ:
 *   - bookingId → Booking (booking cần thanh toán)
 *   - userId    → User    (người thực hiện thanh toán)
 *
 * Tại sao tách Payment ra khỏi Booking:
 *   - 1 booking có thể có nhiều lần thử thanh toán (lần 1 FAILED, lần 2 SUCCESS)
 *   - Cần lưu transactionId từ cổng TT để đối soát sau này
 *   - Logic payment (expire, retry) không phải logic của Booking
 *
 * Status flow:
 *   PENDING → SUCCESS  (thanh toán thành công)
 *   PENDING → FAILED   (thanh toán thất bại / hết hạn session)
 *
 * provider:
 *   "MOCK"  — dùng trong dev, không gọi cổng TT thật
 *   "VNPAY" — production (swap sau, không đổi Application layer)
 *   "MOMO"  — tương tự
 */

const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED"];
const PAYMENT_PROVIDERS = ["MOCK", "VNPAY", "MOMO"];
const SESSION_MINUTES = 15; // payment session hết hạn sau 15 phút

class Payment {
  /**
   * @param {object}      params
   * @param {number|null} params.id
   * @param {number}      params.bookingId
   * @param {number}      params.userId
   * @param {number}      params.amount         — tổng tiền cần thanh toán (VND)
   * @param {string}      params.status         — PENDING | SUCCESS | FAILED
   * @param {string}      params.provider       — MOCK | VNPAY | MOMO
   * @param {string|null} params.transactionId  — id từ cổng TT trả về, null khi chưa TT
   * @param {Date}        params.expiredAt      — payment session hết hạn lúc này
   * @param {Date|null}   params.paidAt         — timestamp khi SUCCESS
   * @param {Date}        params.createdAt
   */
  constructor({
    id,
    bookingId,
    userId,
    amount,
    status,
    provider,
    transactionId,
    expiredAt,
    paidAt,
    createdAt,
  }) {
    this.id = id ?? null;
    this.bookingId = bookingId;
    this.userId = userId;
    this.amount = amount;
    this.status = status ?? "PENDING";
    this.provider = provider ?? "MOCK";
    this.transactionId = transactionId ?? null;
    this.expiredAt =
      expiredAt instanceof Date ? expiredAt : new Date(expiredAt);
    this.paidAt = paidAt ? new Date(paidAt) : null;
    this.createdAt =
      createdAt instanceof Date ? createdAt : new Date(createdAt ?? Date.now());

    this.#validate();
  }

  // ── Validation nội bộ — chạy mỗi lần khởi tạo ──────────────────────
  #validate() {
    if (!this.bookingId || !Number.isInteger(Number(this.bookingId))) {
      throw new Error("bookingId is required and must be an integer");
    }
    if (!this.userId || !Number.isInteger(Number(this.userId))) {
      throw new Error("userId is required and must be an integer");
    }
    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      throw new Error("amount must be a positive number");
    }
    if (!PAYMENT_STATUSES.includes(this.status)) {
      throw new Error(`status must be one of: ${PAYMENT_STATUSES.join(", ")}`);
    }
    if (!PAYMENT_PROVIDERS.includes(this.provider)) {
      throw new Error(
        `provider must be one of: ${PAYMENT_PROVIDERS.join(", ")}`,
      );
    }
    if (!(this.expiredAt instanceof Date) || isNaN(this.expiredAt.getTime())) {
      throw new Error("expiredAt is not a valid date");
    }
  }

  // ── Computed properties ──────────────────────────────────────────────

  /**
   * Payment session còn hạn không.
   * Chỉ PENDING mới có khái niệm expire — SUCCESS/FAILED thì đã kết thúc rồi.
   */
  isExpired() {
    return this.status === "PENDING" && new Date() > this.expiredAt;
  }

  /**
   * Có thể thực hiện thanh toán không.
   * Chỉ cho phép khi PENDING và chưa hết hạn session.
   */
  isPayable() {
    return this.status === "PENDING" && !this.isExpired();
  }

  // ── Business methods ─────────────────────────────────────────────────

  /**
   * Đánh dấu thanh toán thành công.
   * Gọi sau khi cổng TT xác nhận — mock hoặc thật.
   *
   * @param {string} transactionId — id từ cổng TT (mock thì truyền UUID tự sinh)
   */
  complete(transactionId) {
    if (!this.isPayable()) {
      const reason = this.isExpired()
        ? "phiên thanh toán đã hết hạn"
        : `trạng thái hiện tại là "${this.status}"`;
      throw new Error(`Không thể hoàn tất thanh toán: ${reason}`);
    }

    if (!transactionId || typeof transactionId !== "string") {
      throw new Error("transactionId là bắt buộc khi hoàn tất thanh toán");
    }

    this.status = "SUCCESS";
    this.transactionId = transactionId;
    this.paidAt = new Date();
  }

  /**
   * Đánh dấu thanh toán thất bại.
   * Gọi khi cổng TT trả về lỗi, hoặc user huỷ ở trang thanh toán.
   * Sau khi FAILED, booking vẫn ở PENDING — user có thể tạo payment session mới
   * nếu booking chưa hết hold.
   */
  fail() {
    if (this.status !== "PENDING") {
      throw new Error(
        `Không thể đánh dấu thất bại: trạng thái hiện tại là "${this.status}"`,
      );
    }

    this.status = "FAILED";
  }

  // ── Factory methods ──────────────────────────────────────────────────

  /**
   * Tạo payment session mới.
   * Luôn bắt đầu ở PENDING, expiredAt tự tính = now + SESSION_MINUTES.
   *
   * @param {object} params
   * @param {number} params.bookingId
   * @param {number} params.userId
   * @param {number} params.amount      — nên lấy từ booking.totalPrice
   * @param {string} params.provider    — mặc định "MOCK"
   */
  static create({ bookingId, userId, amount, provider = "MOCK" }) {
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + SESSION_MINUTES);

    return new Payment({
      id: null,
      bookingId,
      userId,
      amount,
      status: "PENDING",
      provider,
      transactionId: null,
      expiredAt,
      paidAt: null,
      createdAt: new Date(),
    });
  }

  /** Khôi phục entity từ dữ liệu DB (snake_case) */
  static fromPersistence({
    id,
    booking_id,
    user_id,
    amount,
    status,
    provider,
    transaction_id,
    expired_at,
    paid_at,
    created_at,
  }) {
    return new Payment({
      id: Number(id),
      bookingId: Number(booking_id),
      userId: Number(user_id),
      amount: Number(amount),
      status,
      provider,
      transactionId: transaction_id ?? null,
      expiredAt: new Date(expired_at),
      paidAt: paid_at ? new Date(paid_at) : null,
      createdAt: new Date(created_at),
    });
  }

  // ── Serialization ────────────────────────────────────────────────────

  toJSON() {
    return {
      id: this.id,
      bookingId: this.bookingId,
      userId: this.userId,
      amount: this.amount,
      status: this.status,
      provider: this.provider,
      transactionId: this.transactionId,
      expiredAt: this.expiredAt,
      paidAt: this.paidAt,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      booking_id: this.bookingId,
      user_id: this.userId,
      amount: this.amount,
      status: this.status,
      provider: this.provider,
      transaction_id: this.transactionId,
      expired_at: this.expiredAt,
      paid_at: this.paidAt,
      created_at: this.createdAt,
    };
  }
}

export default Payment;
