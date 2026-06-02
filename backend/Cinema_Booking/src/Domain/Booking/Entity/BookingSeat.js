// src/Domain/Booking/Entity/BookingSeat.js

/**
 * BookingSeat — 1 ghế cụ thể trong 1 booking.
 *
 * Lý do tách thành entity riêng thay vì dùng mảng seatId đơn giản:
 *   - Cần lưu price tại thời điểm đặt (snapshot) — tránh bị ảnh hưởng khi
 *     admin đổi giá showtime sau này
 *   - Cần lưu seatType để hiển thị vé mà không cần join thêm bảng seats
 */
class BookingSeat {
  /**
   * @param {object} params
   * @param {number|null} params.id
   * @param {number}      params.bookingId
   * @param {number}      params.seatId
   * @param {string}      params.seatLabel   — "A1", "B12" — snapshot, không join lại
   * @param {string}      params.seatType    — "NORMAL" | "VIP" | "COUPLE"
   * @param {number}      params.price       — giá tại thời điểm đặt
   */
  constructor({ id, bookingId, seatId, seatLabel, seatType, price }) {
    this.id = id ?? null;
    this.bookingId = bookingId ?? null; // null khi chưa có bookingId (lúc create)
    this.seatId = seatId;
    this.seatLabel = seatLabel;
    this.seatType = seatType;
    this.price = price;
  }

  static create({ seatId, seatLabel, seatType, price }) {
    return new BookingSeat({
      id: null,
      bookingId: null,
      seatId,
      seatLabel,
      seatType,
      price,
    });
  }

  static fromPersistence({
    id,
    booking_id,
    seat_id,
    seat_label,
    seat_type,
    price,
  }) {
    return new BookingSeat({
      id: Number(id),
      bookingId: Number(booking_id),
      seatId: Number(seat_id),
      seatLabel: seat_label,
      seatType: seat_type,
      price: Number(price),
    });
  }

  toJSON() {
    return {
      id: this.id,
      seatId: this.seatId,
      seatLabel: this.seatLabel,
      seatType: this.seatType,
      price: this.price,
    };
  }

  toPersistence() {
    return {
      booking_id: this.bookingId,
      seat_id: this.seatId,
      seat_label: this.seatLabel,
      seat_type: this.seatType,
      price: this.price,
    };
  }
}

export default BookingSeat;
