// src/Infrastructure/Http/Repositories/MySQLBookingRepository.js
import BookingRepositoryInterface from "../../../Domain/Booking/Repository/BookingRepositoryInterface.js";
import Booking from "../../../Domain/Booking/Entity/Booking.js";
import BookingSeat from "../../../Domain/Booking/Entity/BookingSeat.js";
import BookingCombo from "../../../Domain/Booking/Entity/BookingCombo.js";

class MySQLBookingRepository extends BookingRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm booking theo id — kèm seats ───────────────────────────────
  // Dùng trong GetBookingHandler, ConfirmBookingHandler, CancelBookingHandler
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, user_id, showtime_id, total_price,
              status, held_until, confirmed_at, cancelled_at, created_at
       FROM bookings
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    // Fetch song song cả Seats và Combos
    const [seats, combos] = await Promise.all([
      this.#fetchSeats(id),
      this.#fetchCombos(id), // Phương thức mới
    ]);

    return Booking.fromPersistence({ ...rows[0], seats, combos });
  }

  // ── Tìm booking theo id + userId — verify ownership ───────────────
  // Dùng trong GetBookingHandler — tránh user A xem vé của user B
  // Query thẳng WHERE id = ? AND user_id = ? thay vì fetch rồi check
  async findByIdAndUserId(id, userId) {
    const [rows] = await this.pool.execute(
      `SELECT id, user_id, showtime_id, total_price,
              status, held_until, confirmed_at, cancelled_at, created_at
       FROM bookings
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId],
    );

    if (rows.length === 0) return null;

    // Fetch song song cả Seats và Combos
    const [seats, combos] = await Promise.all([
      this.#fetchSeats(id),
      this.#fetchCombos(id),
    ]);

    return Booking.fromPersistence({ ...rows[0], seats, combos });
  }

  // ── Lấy lịch sử đặt vé của 1 user — có phân trang ─────────────────
  // Dùng trong ListBookingsHandler
  // Không fetch seats cho từng booking — danh sách chỉ cần thông tin tổng
  // User click vào 1 booking cụ thể mới cần seats (dùng findById)
  async findByUserId(userId, { page = 1, limit = 10, status = null }) {
    const offset = (page - 1) * limit;
    const conditions = [`user_id = ?`];
    const params = [userId];

    if (status) {
      conditions.push(`status = ?`);
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await this.pool.execute(
      `SELECT id, user_id, showtime_id, total_price,
            status, held_until, confirmed_at, cancelled_at, created_at
     FROM bookings
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total FROM bookings ${whereClause}`,
      params,
    );

    return {
      data: rows.map((row) => Booking.fromPersistence({ ...row, seats: [] })),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // ── Lấy tất cả booking (Admin) — có phân trang và filter ──────────
  async findAll({ page = 1, limit = 10, status = null, userId = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push(`status = ?`);
      params.push(status);
    }
    if (userId) {
      conditions.push(`user_id = ?`);
      params.push(userId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await this.pool.execute(
      `SELECT id, user_id, showtime_id, total_price,
              status, held_until, confirmed_at, cancelled_at, created_at
       FROM bookings
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total FROM bookings ${whereClause}`,
      params,
    );

    return {
      data: rows.map((row) =>
        Booking.fromPersistence({ ...row, seats: [], combos: [] }),
      ),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // ── Lấy seatId đang bị chiếm trong 1 showtime ─────────────────────
  // Dùng trong GetSeatMapForShowtimeHandler
  //
  // "Occupied" = CONFIRMED hoặc PENDING còn trong thời gian hold
  // PENDING hết hạn (held_until <= NOW()) → ghế tự động trống lại
  // không cần cron job xóa — query này tự bỏ qua
  async findOccupiedSeatIdsByShowtimeId(showtimeId) {
    const [rows] = await this.pool.execute(
      `SELECT bs.seat_id
       FROM booking_seats bs
       JOIN bookings b ON b.id = bs.booking_id
       WHERE b.showtime_id = ?
         AND (
           b.status = 'CONFIRMED'
           OR (b.status = 'PENDING' AND b.held_until > NOW())
         )`,
      [showtimeId],
    );

    return rows.map((row) => row.seat_id);
  }

  // ── Lưu booking mới — insert bookings + booking_seats trong transaction
  // Dùng trong CreateBookingHandler
  // Nếu insert booking_seats thất bại → rollback cả booking
  // ── Lưu booking mới — insert bookings + booking_seats + booking_combos
  async save(booking) {
    const conn = await this.pool.getConnection();

    try {
      await conn.beginTransaction();

      // ── Bước 1: Insert booking ───────────────────────────────────────
      const {
        user_id,
        showtime_id,
        total_price,
        status,
        held_until,
        confirmed_at,
        cancelled_at,
        created_at,
      } = booking.toPersistence();

      const [result] = await conn.execute(
        `INSERT INTO bookings
           (user_id, showtime_id, total_price, status,
            held_until, confirmed_at, cancelled_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          showtime_id,
          total_price,
          status,
          held_until,
          confirmed_at,
          cancelled_at,
          created_at,
        ],
      );

      const bookingId = result.insertId;

      // ── Bước 2: Bulk insert booking_seats ───────────────────────────
      const seats = booking.seats;
      const seatPlaceholders = seats.map(() => `(?,?,?,?,?)`).join(",");
      const seatValues = seats.flatMap((seat) => {
        const { seat_id, seat_label, seat_type, price } = seat.toPersistence();
        return [bookingId, seat_id, seat_label, seat_type, price];
      });

      const [seatsResult] = await conn.execute(
        `INSERT INTO booking_seats (booking_id, seat_id, seat_label, seat_type, price)
         VALUES ${seatPlaceholders}`,
        seatValues,
      );

      // ── Bước 3: Bulk insert booking_combos (Mới) ────────────────────
      let firstComboId = null;
      if (booking.combos && booking.combos.length > 0) {
        const comboPlaceholders = booking.combos
          .map(() => `(?,?,?,?,?)`)
          .join(",");
        const comboValues = booking.combos.flatMap((c) => {
          return [bookingId, c.comboId, c.comboName, c.quantity, c.price];
        });

        const [comboResult] = await conn.execute(
          `INSERT INTO booking_combos (booking_id, combo_id, combo_name, quantity, price)
           VALUES ${comboPlaceholders}`,
          comboValues,
        );
        firstComboId = comboResult.insertId;
      }

      await conn.commit();

      // ── Bước 4: Reconstruct entity với id thật ───────────────────────
      const firstSeatId = seatsResult.insertId;

      const savedSeats = seats.map((seat, index) =>
        BookingSeat.fromPersistence({
          id: firstSeatId + index,
          booking_id: bookingId,
          seat_id: seat.seatId,
          seat_label: seat.seatLabel,
          seat_type: seat.seatType,
          price: seat.price,
        }),
      );

      // Reconstruct combos để trả về response
      const savedCombos = (booking.combos || []).map((combo, index) =>
        BookingCombo.fromPersistence({
          id: firstComboId !== null ? firstComboId + index : null,
          booking_id: bookingId,
          combo_id: combo.comboId,
          combo_name: combo.comboName,
          quantity: combo.quantity,
          price: combo.price,
        }),
      );

      return Booking.fromPersistence({
        id: bookingId,
        user_id,
        showtime_id,
        total_price,
        status,
        held_until,
        confirmed_at,
        cancelled_at,
        created_at,
        seats: savedSeats,
        combos: savedCombos, // <-- Đã được gán mảng combos vào đây
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Update booking — chỉ update status, confirmed_at, cancelled_at ─
  // Dùng trong ConfirmBookingHandler và CancelBookingHandler
  // Không cho sửa ghế hay giá sau khi booking đã tạo
  async update(booking) {
    const { status, confirmed_at, cancelled_at } = booking.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE bookings
       SET status       = ?,
           confirmed_at = ?,
           cancelled_at = ?
       WHERE id = ?`,
      [status, confirmed_at, cancelled_at, booking.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Booking với id=${booking.id} không tồn tại`);
    }

    return booking;
  }

  // ── Kiểm tra tồn tại nhẹ ─────────────────────────────────────────
  async existsById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM bookings WHERE id = ? LIMIT 1`,
      [id],
    );

    return rows.length > 0;
  }

  // ── Kiểm tra user đã xem phim chưa — dùng trong CreateRatingHandler ──
  // "Đã xem" = có booking CONFIRMED cho showtime thuộc movieId này
  async existsConfirmedByUserIdAndMovieId(userId, movieId) {
    const [rows] = await this.pool.execute(
      `SELECT 1
     FROM bookings b
     JOIN showtimes s ON s.id = b.showtime_id
     WHERE b.user_id   = ?
       AND s.movie_id  = ?
       AND b.status    = 'CONFIRMED'
     LIMIT 1`,
      [userId, movieId],
    );

    return rows.length > 0;
  }

  // ── Private helpers ───────────────────────────────────────────────

  // Fetch booking_seats của 1 booking — dùng trong findById, findByIdAndUserId
  // Tách riêng để tái dùng, không lặp code JOIN ở cả 2 method trên
  async #fetchSeats(bookingId) {
    const [rows] = await this.pool.execute(
      `SELECT id, booking_id, seat_id, seat_label, seat_type, price
       FROM booking_seats
       WHERE booking_id = ?
       ORDER BY seat_label ASC`,
      [bookingId],
    );

    return rows.map((row) => BookingSeat.fromPersistence(row));
  }

  // Private helper mới để lấy combo
  async #fetchCombos(bookingId) {
    const [rows] = await this.pool.execute(
      `SELECT id, booking_id, combo_id, combo_name, quantity, price
       FROM booking_combos
       WHERE booking_id = ?`,
      [bookingId],
    );
    return rows.map((row) => BookingCombo.fromPersistence(row));
  }

  // Thêm method này vào class MySQLBookingRepository

  // ── Update booking trong connection có sẵn — dùng trong transaction ──
  // Dùng khi ConfirmPaymentHandler cần update payment + booking cùng lúc
  // Pattern giống updateWithConn trong MySQLPaymentRepository
  async updateWithConn(booking, conn) {
    const { status, confirmed_at, cancelled_at } = booking.toPersistence();

    const [result] = await conn.execute(
      `UPDATE bookings
     SET status       = ?,
         confirmed_at = ?,
         cancelled_at = ?
     WHERE id = ?`,
      [status, confirmed_at, cancelled_at, booking.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Booking với id=${booking.id} không tồn tại`);
    }

    return booking;
  }
}

export default MySQLBookingRepository;
