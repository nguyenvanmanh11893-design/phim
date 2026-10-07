// src/Infrastructure/Http/Repositories/MySQLTicketRepository.js
import AppError from "../../../Domain/Errors/AppError.js";
import TicketRepositoryInterface from "../../../Domain/Ticket/Repository/TicketRepositoryInterface.js";
import Ticket from "../../../Domain/Ticket/Entity/Ticket.js";

class MySQLTicketRepository extends TicketRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Lưu vé mới ──────────────────────────────────────────────────────
  // Dùng trong IssueTicketHandler sau khi payment thành công
  async save(ticket, executor = this.pool) {
    const {
      booking_id,
      user_id,
      showtime_id,
      qr_code,
      is_used,
      used_at,
      issued_at,
    } = ticket.toPersistence();

    const [result] = await executor.execute(
      `INSERT INTO tickets 
        (booking_id, user_id, showtime_id, qr_code, is_used, used_at, issued_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [booking_id, user_id, showtime_id, qr_code, is_used, used_at, issued_at],
    );

    return Ticket.fromPersistence({
      id: result.insertId,
      booking_id,
      user_id,
      showtime_id,
      qr_code,
      is_used,
      used_at,
      issued_at,
    });
  }

  async issueForConfirmedBooking(bookingId, userId, createTicket) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[booking]] = await conn.execute("SELECT * FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE", [bookingId, userId]);
      if (!booking) throw new AppError("Không tìm thấy booking", 404);
      if (booking.status !== "CONFIRMED") throw new AppError("Booking chưa được xác nhận thanh toán", 422);
      const [[paid]] = await conn.execute("SELECT id, provider FROM payments WHERE booking_id = ? AND status = 'SUCCESS' AND review_reason IS NULL ORDER BY id LIMIT 1", [bookingId]);
      if (!paid) throw new AppError("Booking chưa có thanh toán hợp lệ", 422);
      const [[existing]] = await conn.execute("SELECT * FROM tickets WHERE booking_id = ? LIMIT 1 FOR UPDATE", [bookingId]);
      const ticket = existing ? Ticket.fromPersistence(existing) : await this.save(createTicket(booking), conn);
      await conn.commit();
      return { ticket, created: !existing, provider: paid.provider };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { conn.release(); }
  }

  async findMissingPaidTickets(afterId = 0) {
    const [rows] = await this.pool.execute(`SELECT b.id, b.user_id FROM bookings b
      WHERE b.status = 'CONFIRMED' AND b.id > ?
      AND EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'SUCCESS' AND p.review_reason IS NULL)
      AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.booking_id = b.id)
      ORDER BY b.id LIMIT 25`, [afterId]);
    return rows;
  }

  // ── Tìm vé theo bookingId ───────────────────────────────────────────
  // Dùng trong GetTicketHandler để user xem vé của mình
  async findByBookingId(bookingId) {
    const [rows] = await this.pool.execute(
      `SELECT id, booking_id, user_id, showtime_id, qr_code, is_used, used_at, issued_at
       FROM tickets
       WHERE booking_id = ?
       LIMIT 1`,
      [bookingId],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Tìm vé theo qrCode ──────────────────────────────────────────────
  // Dùng trong ValidateTicketHandler khi nhân viên quét mã QR
  async findByQrCode(qrCode) {
    const [rows] = await this.pool.execute(
      `SELECT id, booking_id, user_id, showtime_id, qr_code, is_used, used_at, issued_at
       FROM tickets
       WHERE qr_code = ?
       LIMIT 1`,
      [qrCode],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Cập nhật vé (đánh dấu đã sử dụng) ───────────────────────────────
  // Dùng trong ValidateTicketHandler
  // Chỉ cập nhật is_used và used_at, các thông tin khác của vé là bất biến
  async update(ticket) {
    const { is_used, used_at } = ticket.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE tickets
       SET is_used = ?,
           used_at = ?
       WHERE id = ?`,
      [is_used, used_at, ticket.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Ticket với id=${ticket.id} không tồn tại`);
    }

    return ticket;
  }

  // ── Kiểm tra vé đã tồn tại cho booking này chưa ─────────────────────
  // Dùng trong IssueTicketHandler để đảm bảo Idempotency (không sinh vé trùng)
  async existsByBookingId(bookingId) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM tickets WHERE booking_id = ? LIMIT 1`,
      [bookingId],
    );

    return rows.length > 0;
  }

  // ── Private helper — map raw DB row → Ticket entity ─────────────────
  #toEntity(row) {
    return Ticket.fromPersistence({
      id: row.id,
      booking_id: row.booking_id,
      user_id: row.user_id,
      showtime_id: row.showtime_id,
      qr_code: row.qr_code,
      is_used: row.is_used,
      used_at: row.used_at,
      issued_at: row.issued_at,
    });
  }
}

export default MySQLTicketRepository;
