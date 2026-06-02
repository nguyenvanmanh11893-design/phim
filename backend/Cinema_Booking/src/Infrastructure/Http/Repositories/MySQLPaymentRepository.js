// Infrastructure/Http/Repositories/MySQLPaymentRepository.js
import PaymentRepositoryInterface from "../../../Domain/Payment/Repository/PaymentRepositoryInterface.js";
import Payment from "../../../Domain/Payment/Entity/Payment.js";

class MySQLPaymentRepository extends PaymentRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm payment theo id ───────────────────────────────────────────
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, booking_id, user_id, amount, status, provider,
              transaction_id, expired_at, paid_at, created_at
       FROM payments
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return Payment.fromPersistence(rows[0]);
  }

  // ── Tìm payment theo id + userId — verify ownership ───────────────
  async findByIdAndUserId(id, userId) {
    const [rows] = await this.pool.execute(
      `SELECT id, booking_id, user_id, amount, status, provider,
              transaction_id, expired_at, paid_at, created_at
       FROM payments
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId],
    );

    if (rows.length === 0) return null;

    return Payment.fromPersistence(rows[0]);
  }

  // ── Tìm payment PENDING còn hạn của 1 booking ─────────────────────
  // Dùng trong InitiatePaymentHandler — tránh tạo 2 session cùng lúc
  // "active" = PENDING && expired_at > NOW()
  async findActiveByBookingId(bookingId) {
    const [rows] = await this.pool.execute(
      `SELECT id, booking_id, user_id, amount, status, provider,
              transaction_id, expired_at, paid_at, created_at
       FROM payments
       WHERE booking_id = ?
         AND status     = 'PENDING'
         AND expired_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [bookingId],
    );

    if (rows.length === 0) return null;

    return Payment.fromPersistence(rows[0]);
  }

  // ── Lưu payment session mới ───────────────────────────────────────
  async save(payment) {
    const {
      booking_id,
      user_id,
      amount,
      status,
      provider,
      transaction_id,
      expired_at,
      paid_at,
      created_at,
    } = payment.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO payments
         (booking_id, user_id, amount, status, provider,
          transaction_id, expired_at, paid_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking_id,
        user_id,
        amount,
        status,
        provider,
        transaction_id,
        expired_at,
        paid_at,
        created_at,
      ],
    );

    return Payment.fromPersistence({
      id: result.insertId,
      booking_id,
      user_id,
      amount,
      status,
      provider,
      transaction_id,
      expired_at,
      paid_at,
      created_at,
    });
  }

  // ── Update payment — chỉ update status, transactionId, paidAt ─────
  // Không cho sửa amount hay bookingId sau khi đã tạo session
  async update(payment) {
    const { status, transaction_id, paid_at } = payment.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE payments
       SET status         = ?,
           transaction_id = ?,
           paid_at        = ?
       WHERE id = ?`,
      [status, transaction_id, paid_at, payment.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Payment với id=${payment.id} không tồn tại`);
    }

    return payment;
  }

  // ── Update payment trong connection có sẵn — dùng trong transaction ─
  // Nhận conn thay vì tự lấy từ pool
  // Dùng conn.execute thay vì this.pool.execute để nằm trong transaction
  async updateWithConn(payment, conn) {
    const { status, transaction_id, paid_at } = payment.toPersistence();

    const [result] = await conn.execute(
      `UPDATE payments
       SET status         = ?,
           transaction_id = ?,
           paid_at        = ?
       WHERE id = ?`,
      [status, transaction_id, paid_at, payment.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Payment với id=${payment.id} không tồn tại`);
    }

    return payment;
  }

  // ── Transaction wrapper ────────────────────────────────────────────
  // Dùng trong ConfirmPaymentHandler — update payment + booking cùng lúc
  // Pattern giống MySQLRoomRepository.withTransaction()
  async withTransaction(fn) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

export default MySQLPaymentRepository;
