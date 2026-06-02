// src/Domain/Booking/Entity/Booking.js

const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"];
const HOLD_MINUTES = 10; // giữ ghế 10 phút

class Booking {
  /**
   * @param {object} params
   * @param {number|null}  params.id
   * @param {number}       params.userId
   * @param {number}       params.showtimeId
   * @param {BookingSeat[]} params.seats      — danh sách ghế đã chọn
   * @param {number}       params.totalPrice  — tổng tiền (VND)
   * @param {string}       params.status      — PENDING | CONFIRMED | CANCELLED
   * @param {Date}         params.heldUntil   — hết giờ này mà chưa CONFIRMED → tự giải phóng ghế
   * @param {Date|null}    params.confirmedAt
   * @param {Date|null}    params.cancelledAt
   * @param {Date}         params.createdAt
   */
  constructor({
    id,
    userId,
    showtimeId,
    seats,
    combos,
    totalPrice,
    status,
    heldUntil,
    confirmedAt,
    cancelledAt,
    createdAt,
  }) {
    this.id = id ?? null;
    this.userId = userId;
    this.showtimeId = showtimeId;
    this.seats = seats ?? []; // mảng BookingSeat
    this.combos = combos ?? []; // mảng BookingCombo
    this.totalPrice = totalPrice;
    this.status = status ?? "PENDING";
    this.heldUntil =
      heldUntil instanceof Date ? heldUntil : new Date(heldUntil);
    this.confirmedAt = confirmedAt ? new Date(confirmedAt) : null;
    this.cancelledAt = cancelledAt ? new Date(cancelledAt) : null;
    this.createdAt =
      createdAt instanceof Date ? createdAt : new Date(createdAt ?? Date.now());

    this.#validate();
  }

  // ── Validation ───────────────────────────────────────────────────────
  #validate() {
    if (!this.userId || !Number.isInteger(Number(this.userId))) {
      throw new Error("userId is required and must be an integer");
    }
    if (!this.showtimeId || !Number.isInteger(Number(this.showtimeId))) {
      throw new Error("showtimeId is required and must be an integer");
    }
    if (!Number.isFinite(this.totalPrice) || this.totalPrice < 0) {
      throw new Error("totalPrice must be a non-negative number");
    }
    if (!BOOKING_STATUSES.includes(this.status)) {
      throw new Error(`status must be one of: ${BOOKING_STATUSES.join(", ")}`);
    }
    if (!(this.heldUntil instanceof Date) || isNaN(this.heldUntil.getTime())) {
      throw new Error("heldUntil is not a valid date");
    }
  }

  // ── Business helpers ─────────────────────────────────────────────────

  /** Hold còn hiệu lực không — PENDING mà quá hạn thì ghế bị giải phóng */
  isHoldExpired() {
    return this.status === "PENDING" && new Date() > this.heldUntil;
  }

  /** Có thể confirm không */
  isConfirmable() {
    return this.status === "PENDING" && !this.isHoldExpired();
  }

  /** Xác nhận booking sau khi thanh toán thành công */
  confirm() {
    if (!this.isConfirmable()) {
      throw new Error(
        this.isHoldExpired()
          ? "Booking đã hết thời gian giữ ghế"
          : `Không thể xác nhận booking ở trạng thái "${this.status}"`,
      );
    }
    this.status = "CONFIRMED";
    this.confirmedAt = new Date();
  }

  /** Huỷ booking — chỉ được huỷ khi chưa CONFIRMED */
  cancel() {
    if (this.status === "CANCELLED") {
      throw new Error("Booking đã được huỷ trước đó");
    }
    if (this.status === "CONFIRMED") {
      throw new Error("Booking đã được xác nhận, không thể huỷ trực tiếp");
    }
    this.status = "CANCELLED";
    this.cancelledAt = new Date();
  }

  /** Danh sách seatId — tiện dùng khi query conflict */
  get seatIds() {
    return this.seats.map((s) => s.seatId);
  }

  // ── Factory methods ──────────────────────────────────────────────────

  /**
   * Tạo booking mới — status luôn là PENDING, heldUntil tự tính
   *
   * @param {object} params
   * @param {number}       params.userId
   * @param {number}       params.showtimeId
   * @param {BookingSeat[]} params.seats
   * @param {BookingCombo[]} params.combos
   * @param {number}       params.totalPrice
   */
  static create({ userId, showtimeId, seats, combos, totalPrice }) {
    const heldUntil = new Date();
    heldUntil.setMinutes(heldUntil.getMinutes() + HOLD_MINUTES);

    if (!Array.isArray(seats) || seats.length === 0) {
      throw new Error("seats must be a non-empty array");
    }

    return new Booking({
      id: null,
      userId,
      showtimeId,
      seats,
      combos: combos ?? [],
      totalPrice,
      status: "PENDING",
      heldUntil,
      confirmedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
    });
  }

  /** Khôi phục từ DB — seats được truyền vào riêng sau khi query booking_seats */
  static fromPersistence({
    id,
    user_id,
    showtime_id,
    total_price,
    status,
    held_until,
    confirmed_at,
    cancelled_at,
    created_at,
    seats = [],
    combos = [],
  }) {
    return new Booking({
      id: Number(id),
      userId: Number(user_id),
      showtimeId: Number(showtime_id),
      seats,
      combos,
      totalPrice: Number(total_price),
      status,
      heldUntil: new Date(held_until),
      confirmedAt: confirmed_at ? new Date(confirmed_at) : null,
      cancelledAt: cancelled_at ? new Date(cancelled_at) : null,
      createdAt: new Date(created_at),
    });
  }

  // ── Serialization ────────────────────────────────────────────────────

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      showtimeId: this.showtimeId,
      seats: this.seats.map((s) => s.toJSON()),
      combos: this.combos.map((c) => c.toJSON()),
      totalPrice: this.totalPrice,
      status: this.status,
      heldUntil: this.heldUntil,
      confirmedAt: this.confirmedAt,
      cancelledAt: this.cancelledAt,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      user_id: this.userId,
      showtime_id: this.showtimeId,
      total_price: this.totalPrice,
      status: this.status,
      held_until: this.heldUntil,
      confirmed_at: this.confirmedAt,
      cancelled_at: this.cancelledAt,
      created_at: this.createdAt,
    };
  }
}

export default Booking;
