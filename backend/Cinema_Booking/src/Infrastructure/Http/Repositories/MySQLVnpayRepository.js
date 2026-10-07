import Payment from "../../../Domain/Payment/Entity/Payment.js";
import AppError from "../../../Domain/Errors/AppError.js";

class MySQLVnpayRepository {
  constructor(pool) { this.pool = pool; }

  async transaction(fn) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { conn.release(); }
  }

  async createSession(bookingId, userId) {
    return this.transaction(async (conn) => {
      const [[booking]] = await conn.execute(
        "SELECT *, held_until > NOW() AS hold_valid FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE", [bookingId, userId]);
      if (!booking) throw new AppError("Không tìm thấy booking", 404);
      if (booking.status !== "PENDING" || !booking.hold_valid) throw new AppError("Booking không còn trong thời gian giữ ghế", 422);
      const [[showtime]] = await conn.execute("SELECT CASE WHEN cancelled_at IS NOT NULL THEN 'CANCELLED' WHEN start_time > NOW() THEN 'SCHEDULED' ELSE 'UNAVAILABLE' END AS status FROM showtimes WHERE id = ? FOR UPDATE", [booking.showtime_id]);
      if (!showtime || showtime.status !== "SCHEDULED") throw new AppError("Suất chiếu không còn khả dụng", 422);
      const [[paid]] = await conn.execute("SELECT id FROM payments WHERE booking_id = ? AND status = 'SUCCESS' LIMIT 1", [bookingId]);
      if (paid) throw new AppError("Booking đã có khoản thanh toán thành công, cần kiểm tra trạng thái booking", 409);
      const [[active]] = await conn.execute(
        "SELECT * FROM payments WHERE booking_id = ? AND provider = 'VNPAY' AND status = 'PENDING' AND expired_at > NOW() ORDER BY id DESC LIMIT 1 FOR UPDATE", [bookingId]);
      if (active) {
        if (new Date(active.expired_at) > new Date(booking.held_until)) {
          await conn.execute("UPDATE payments SET expired_at = ? WHERE id = ?", [booking.held_until, active.id]);
          active.expired_at = booking.held_until;
        }
        return Payment.fromPersistence(active);
      }
      await conn.execute("UPDATE payments SET status = 'FAILED' WHERE booking_id = ? AND provider = 'MOCK' AND status = 'PENDING'", [bookingId]);
      const [[clock]] = await conn.execute("SELECT NOW() AS created_at");
      const [result] = await conn.execute(
        "INSERT INTO payments (booking_id, user_id, amount, status, provider, expired_at, created_at) VALUES (?, ?, ?, 'PENDING', 'VNPAY', ?, ?)",
        [bookingId, userId, booking.total_price, booking.held_until, clock.created_at]);
      return Payment.fromPersistence({ id: result.insertId, booking_id: bookingId, user_id: userId,
        amount: booking.total_price, status: "PENDING", provider: "VNPAY",
        expired_at: booking.held_until, created_at: clock.created_at });
    });
  }

  async findPayment(id) {
    const [[row]] = await this.pool.execute("SELECT * FROM payments WHERE id = ? AND provider = 'VNPAY'", [id]);
    return row || null;
  }
  async lockBooking(conn, id) {
    const [[row]] = await conn.execute("SELECT *, held_until > NOW() AS hold_valid FROM bookings WHERE id = ? FOR UPDATE", [id]);
    return row;
  }
  async lockPayment(conn, id) {
    const [[row]] = await conn.execute("SELECT * FROM payments WHERE id = ? FOR UPDATE", [id]);
    return row;
  }
  async lockShowtime(conn, id) {
    const [[row]] = await conn.execute("SELECT CASE WHEN cancelled_at IS NOT NULL THEN 'CANCELLED' WHEN start_time > NOW() THEN 'SCHEDULED' ELSE 'UNAVAILABLE' END AS status FROM showtimes WHERE id = ? FOR UPDATE", [id]);
    return row;
  }
  async hasOtherSuccess(conn, bookingId, paymentId) {
    const [[row]] = await conn.execute("SELECT id FROM payments WHERE booking_id = ? AND id <> ? AND status = 'SUCCESS' LIMIT 1", [bookingId, paymentId]);
    return Boolean(row);
  }
  async hasSeatConflict(conn, bookingId, showtimeId) {
    const [[row]] = await conn.execute(`SELECT 1 FROM booking_seats own_seat
      JOIN booking_seats other_seat ON other_seat.seat_id = own_seat.seat_id
      JOIN bookings other_booking ON other_booking.id = other_seat.booking_id
      WHERE own_seat.booking_id = ? AND other_booking.id <> ? AND other_booking.showtime_id = ?
      AND (other_booking.status = 'CONFIRMED' OR (other_booking.status = 'PENDING' AND other_booking.held_until > NOW()))
      LIMIT 1`, [bookingId, bookingId, showtimeId]);
    return Boolean(row);
  }

  async recordResult(conn, paymentId, result, reviewReason) {
    await conn.execute(`UPDATE payments SET status = ?, transaction_id = ?, paid_at = ?,
      gateway_response_code = ?, gateway_transaction_status = ?, review_reason = ?, gateway_processed_at = NOW()
      WHERE id = ?`, [result.success ? "SUCCESS" : "FAILED", result.transactionId,
      result.success ? result.paidAt : null, result.responseCode, result.transactionStatus, reviewReason, paymentId]);
  }
  async confirmBooking(conn, id) {
    const [result] = await conn.execute("UPDATE bookings SET status = 'CONFIRMED', confirmed_at = NOW() WHERE id = ? AND status = 'PENDING' AND held_until > NOW()", [id]);
    return result.affectedRows === 1;
  }
  async listReviewRequired({ page, limit }) {
    const [rows] = await this.pool.execute(`SELECT id, booking_id AS bookingId, user_id AS userId,
      amount, status, transaction_id AS transactionId, paid_at AS paidAt,
      review_reason AS reviewReason, gateway_response_code AS gatewayResponseCode,
      gateway_transaction_status AS gatewayTransactionStatus FROM payments
      WHERE provider = 'VNPAY' AND review_reason IS NOT NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
      [String(limit), String((page - 1) * limit)]);
    const [[{ total }]] = await this.pool.execute("SELECT COUNT(*) AS total FROM payments WHERE provider = 'VNPAY' AND review_reason IS NOT NULL");
    return { data: rows.map(row => ({ ...row, amount: Number(row.amount), provider: "VNPAY", reviewRequired: true })), total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) };
  }
}
export default MySQLVnpayRepository;

