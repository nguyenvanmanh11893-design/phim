// src/Domain/Ticket/Entity/Ticket.js

/**
 * Ticket — vé điện tử được sinh sau khi Booking chuyển sang CONFIRMED.
 *
 * Quan hệ:
 *   - bookingId  → Booking  (booking đã thanh toán)
 *   - userId     → User     (chủ vé)
 *   - showtimeId → Showtime (suất chiếu)
 *
 * qrCode: chuỗi unique dùng để mã hoá thành QR image ở tầng Infrastructure.
 * Tầng Domain không biết về thư viện qrcode — chỉ lưu chuỗi raw.
 *
 * isUsed: vé đã được quét vào rạp chưa.
 * usedAt: timestamp khi bị quét — null nếu chưa dùng.
 */
class Ticket {
  /**
   * @param {object}      params
   * @param {number|null} params.id
   * @param {number}      params.bookingId
   * @param {number}      params.userId
   * @param {number}      params.showtimeId
   * @param {string}      params.qrCode     — chuỗi unique, dùng để sinh QR image
   * @param {boolean}     params.isUsed     — đã quét vào rạp chưa
   * @param {Date|null}   params.usedAt     — thời điểm quét, null nếu chưa dùng
   * @param {Date}        params.issuedAt   — thời điểm phát hành vé
   */
  constructor({
    id,
    bookingId,
    userId,
    showtimeId,
    qrCode,
    isUsed,
    usedAt,
    issuedAt,
  }) {
    this.id = id ?? null;
    this.bookingId = bookingId;
    this.userId = userId;
    this.showtimeId = showtimeId;
    this.qrCode = qrCode;
    this.isUsed = isUsed ?? false;
    this.usedAt = usedAt ? new Date(usedAt) : null;
    this.issuedAt =
      issuedAt instanceof Date ? issuedAt : new Date(issuedAt ?? Date.now());

    this.#validate();
  }

  // ── Validation nội bộ ────────────────────────────────────────────────
  #validate() {
    if (!this.bookingId || !Number.isInteger(Number(this.bookingId))) {
      throw new Error("bookingId is required and must be an integer");
    }
    if (!this.userId || !Number.isInteger(Number(this.userId))) {
      throw new Error("userId is required and must be an integer");
    }
    if (!this.showtimeId || !Number.isInteger(Number(this.showtimeId))) {
      throw new Error("showtimeId is required and must be an integer");
    }
    if (
      !this.qrCode ||
      typeof this.qrCode !== "string" ||
      this.qrCode.trim().length === 0
    ) {
      throw new Error("qrCode is required and must be a non-empty string");
    }
    if (typeof this.isUsed !== "boolean") {
      throw new Error("isUsed must be a boolean");
    }
  }

  // ── Business helpers ─────────────────────────────────────────────────

  /** Vé còn hợp lệ để quét không — chưa dùng */
  isValid() {
    return !this.isUsed;
  }

  /**
   * Đánh dấu vé đã được quét vào rạp.
   * Chỉ được dùng 1 lần — quét lần 2 sẽ throw.
   */
  markAsUsed() {
    if (this.isUsed) {
      throw new Error("Vé này đã được sử dụng");
    }
    this.isUsed = true;
    this.usedAt = new Date();
  }

  // ── Factory methods ──────────────────────────────────────────────────

  /**
   * Tạo vé mới.
   * qrCode được truyền vào từ Handler — Handler dùng crypto.randomUUID()
   * hoặc bất kỳ chuỗi unique nào, Domain không quan tâm format.
   */
  static create({ bookingId, userId, showtimeId, qrCode }) {
    return new Ticket({
      id: null,
      bookingId,
      userId,
      showtimeId,
      qrCode,
      isUsed: false,
      usedAt: null,
      issuedAt: new Date(),
    });
  }

  /** Khôi phục entity từ dữ liệu DB (snake_case) */
  static fromPersistence({
    id,
    booking_id,
    user_id,
    showtime_id,
    qr_code,
    is_used,
    used_at,
    issued_at,
  }) {
    return new Ticket({
      id: Number(id),
      bookingId: Number(booking_id),
      userId: Number(user_id),
      showtimeId: Number(showtime_id),
      qrCode: qr_code,
      isUsed: Boolean(is_used),
      usedAt: used_at ? new Date(used_at) : null,
      issuedAt: new Date(issued_at),
    });
  }

  // ── Serialization ────────────────────────────────────────────────────

  toJSON() {
    return {
      id: this.id,
      bookingId: this.bookingId,
      userId: this.userId,
      showtimeId: this.showtimeId,
      qrCode: this.qrCode,
      isUsed: this.isUsed,
      usedAt: this.usedAt,
      issuedAt: this.issuedAt,
    };
  }

  toPersistence() {
    return {
      booking_id: this.bookingId,
      user_id: this.userId,
      showtime_id: this.showtimeId,
      qr_code: this.qrCode,
      is_used: this.isUsed ? 1 : 0,
      used_at: this.usedAt,
      issued_at: this.issuedAt,
    };
  }
}

export default Ticket;
