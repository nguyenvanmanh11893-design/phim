// src/Domain/Booking/Entity/BookingCombo.js

class BookingCombo {
  /**
   * @param {object} params
   * @param {number|null} params.id
   * @param {number}      params.bookingId
   * @param {number}      params.comboId
   * @param {string}      params.comboName  — Snapshot tên combo
   * @param {number}      params.quantity   — Số lượng đặt
   * @param {number}      params.price      — Snapshot giá tại thời điểm đặt
   */
  constructor({ id, bookingId, comboId, comboName, quantity, price }) {
    this.id = id ?? null;
    this.bookingId = bookingId ?? null;
    this.comboId = comboId;
    this.comboName = comboName;
    this.quantity = quantity;
    this.price = price;
  }

  static create({ comboId, comboName, quantity, price }) {
    return new BookingCombo({
      id: null,
      bookingId: null,
      comboId,
      comboName,
      quantity,
      price,
    });
  }

  static fromPersistence({
    id,
    booking_id,
    combo_id,
    combo_name,
    quantity,
    price,
  }) {
    return new BookingCombo({
      id: Number(id),
      bookingId: Number(booking_id),
      comboId: Number(combo_id),
      comboName: combo_name,
      quantity: Number(quantity),
      price: Number(price),
    });
  }

  toJSON() {
    return {
      id: this.id,
      comboId: this.comboId,
      comboName: this.comboName,
      quantity: this.quantity,
      price: this.price,
      subTotal: this.price * this.quantity,
    };
  }

  toPersistence() {
    return {
      booking_id: this.bookingId,
      combo_id: this.comboId,
      combo_name: this.comboName,
      quantity: this.quantity,
      price: this.price,
    };
  }
}

export default BookingCombo;
