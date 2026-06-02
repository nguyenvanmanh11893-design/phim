// Infrastructure/Http/Repositories/MySQLShowtimeRepository.js
import ShowtimeRepositoryInterface from "../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js";
import Showtime from "../../../Domain/Showtime/Entity/Showtime.js";
import Movie from "../../../Domain/Movie/Entity/Movie.js";
import Room from "../../../Domain/Cinema/Entity/Room.js";
import Cinema from "../../../Domain/Cinema/Entity/Cinema.js";

class MySQLShowtimeRepository extends ShowtimeRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm suất chiếu theo id ────────────────────────────────────────
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, movie_id, room_id, start_time, end_time,
              base_price, vip_price, couple_price,
              cancelled_at, created_at
       FROM showtimes
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return Showtime.fromPersistence(rows[0]);
  }

  // ── Tìm suất chiếu kèm movie + room + cinema — dùng trong GetShowtimeHandler ──
  // JOIN 3 bảng trong 1 query — tránh N+1 ở Handler
  async findByIdWithDetails(id) {
    const [rows] = await this.pool.execute(
      `SELECT
         s.id,
         s.movie_id,
         s.room_id,
         s.start_time,
         s.end_time,
         s.base_price,
         s.vip_price,
         s.couple_price,
         s.cancelled_at,
         s.created_at,

         m.id            AS movie__id,
         m.title         AS movie__title,
         m.duration      AS movie__duration,
         m.genres        AS movie__genres,
         m.directors     AS movie__directors,
         m.release_date  AS movie__release_date,
         m.end_date      AS movie__end_date,
         m.poster_url    AS movie__poster_url,
         m.description   AS movie__description,
         m.age_rating    AS movie__age_rating,
         m.language      AS movie__language,
         m.created_at    AS movie__created_at,

         r.id            AS room__id,
         r.cinema_id     AS room__cinema_id,
         r.name          AS room__name,
         r.type          AS room__type,
         r.total_rows    AS room__total_rows,
         r.seats_per_row AS room__seats_per_row,
         r.created_at    AS room__created_at,

         c.id            AS cinema__id,
         c.name          AS cinema__name,
         c.address       AS cinema__address,
         c.city          AS cinema__city,
         c.phone         AS cinema__phone,
         c.image_url     AS cinema__image_url,
         c.created_at    AS cinema__created_at

       FROM showtimes s
       JOIN movies  m ON m.id = s.movie_id
       JOIN rooms   r ON r.id = s.room_id
       JOIN cinemas c ON c.id = r.cinema_id
       WHERE s.id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    const row = rows[0];

    return {
      showtime: Showtime.fromPersistence(row),
      movie: this.#rowToMovie(row),
      room: this.#rowToRoom(row),
      cinema: this.#rowToCinema(row),
    };
  }

  // ── Lấy danh sách suất chiếu — filter + phân trang ────────────────
  async findAll({ movieId, cinemaId, date, status, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // ── Filter theo phim ──────────────────────────────────────────────
    if (movieId) {
      conditions.push(`s.movie_id = ?`);
      params.push(movieId);
    }

    // ── Filter theo rạp — join qua rooms ─────────────────────────────
    if (cinemaId) {
      conditions.push(`r.cinema_id = ?`);
      params.push(cinemaId);
    }

    // ── Filter theo ngày — so sánh DATE(start_time) ───────────────────
    // date là Date object từ Query — format thành YYYY-MM-DD cho MySQL
    if (date) {
      conditions.push(`DATE(s.start_time) = ?`);
      params.push(this.#formatDate(date));
    }

    // ── Filter theo status — tính động từ start_time/end_time/cancelled_at
    // Không có cột status trong DB, phải dịch sang điều kiện thời gian
    if (status) {
      const now = new Date();
      switch (status) {
        case "SCHEDULED":
          conditions.push(`s.start_time > ? AND s.cancelled_at IS NULL`);
          params.push(now);
          break;
        case "ONGOING":
          conditions.push(
            `s.start_time <= ? AND s.end_time >= ? AND s.cancelled_at IS NULL`,
          );
          params.push(now, now);
          break;
        case "ENDED":
          conditions.push(`s.end_time < ? AND s.cancelled_at IS NULL`);
          params.push(now);
          break;
        case "CANCELLED":
          conditions.push(`s.cancelled_at IS NOT NULL`);
          break;
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // ── Query data — JOIN rooms để filter cinemaId được ───────────────
    // LEFT JOIN vẫn đúng vì mọi showtime đều có room (FK constraint)
    const [rows] = await this.pool.execute(
      `SELECT
         s.id, s.movie_id, s.room_id, s.start_time, s.end_time,
         s.base_price, s.vip_price, s.couple_price,
         s.cancelled_at, s.created_at
       FROM showtimes s
       JOIN rooms r ON r.id = s.room_id
       ${whereClause}
       ORDER BY s.start_time ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    // ── Query đếm tổng ────────────────────────────────────────────────
    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total
       FROM showtimes s
       JOIN rooms r ON r.id = s.room_id
       ${whereClause}`,
      params,
    );

    return {
      data: rows.map((row) => Showtime.fromPersistence(row)),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // ── Tìm suất chiếu bị conflict lịch trong cùng phòng ─────────────
  // Overlap condition: startTime_mới < end_time_cũ AND endTime_mới > start_time_cũ
  // Bỏ qua suất đã huỷ (cancelled_at IS NULL) và bỏ qua chính nó (excludeId)
  async findConflicting({ roomId, startTime, endTime, excludeId = null }) {
    const params = [roomId, endTime, startTime];
    let excludeClause = "";

    if (excludeId) {
      excludeClause = `AND id != ?`;
      params.push(excludeId);
    }

    const [rows] = await this.pool.execute(
      `SELECT id, movie_id, room_id, start_time, end_time,
              base_price, vip_price, couple_price,
              cancelled_at, created_at
       FROM showtimes
       WHERE room_id = ?
         AND start_time < ?
         AND end_time   > ?
         AND cancelled_at IS NULL
         ${excludeClause}`,
      params,
    );

    return rows.map((row) => Showtime.fromPersistence(row));
  }

  // ── Lưu suất chiếu mới ────────────────────────────────────────────
  async save(showtime) {
    const {
      movie_id,
      room_id,
      start_time,
      end_time,
      base_price,
      vip_price,
      couple_price,
      cancelled_at,
      created_at,
    } = showtime.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO showtimes
         (movie_id, room_id, start_time, end_time,
          base_price, vip_price, couple_price, cancelled_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movie_id,
        room_id,
        start_time,
        end_time,
        base_price,
        vip_price,
        couple_price,
        cancelled_at,
        created_at,
      ],
    );

    return Showtime.fromPersistence({
      id: result.insertId,
      movie_id,
      room_id,
      start_time,
      end_time,
      base_price,
      vip_price,
      couple_price,
      cancelled_at,
      created_at,
    });
  }

  // ── Update suất chiếu — chỉ dùng để ghi cancelled_at ─────────────
  // Không cho phép đổi giờ chiếu hay giá vé sau khi đã tạo
  // vì booking đã dựa vào những thông tin đó
  async update(showtime) {
    const { cancelled_at } = showtime.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE showtimes
       SET cancelled_at = ?
       WHERE id = ?`,
      [cancelled_at, showtime.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Showtime với id=${showtime.id} không tồn tại`);
    }

    return showtime;
  }

  // ── Kiểm tra tồn tại nhẹ ─────────────────────────────────────────
  async existsById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM showtimes WHERE id = ? LIMIT 1`,
      [id],
    );

    return rows.length > 0;
  }

  // =====================================================================
  // CÁC HÀM PHỤC VỤ CHO UPDATE SHOWTIME
  // =====================================================================

  /**
   * Kiểm tra xem suất chiếu đã có vé nào được đặt (chưa bị huỷ) hay không
   * @param {number} showtimeId
   * @returns {Promise<boolean>}
   */
  async hasBookings(showtimeId) {
    // Chỉ check những booking không bị huỷ (CANCELLED)
    const query = `
      SELECT 1 
      FROM bookings 
      WHERE showtime_id = ? AND status != 'CANCELLED'
      LIMIT 1
    `;
    const [rows] = await this.pool.query(query, [showtimeId]);
    return rows.length > 0;
  }

  /**
   * Cập nhật các trường chi tiết của suất chiếu vào DB
   * @param {Showtime} showtime
   * @returns {Promise<Showtime>}
   */
  async updateDetails(showtime) {
    const query = `
      UPDATE showtimes 
      SET 
        room_id = ?, 
        start_time = ?, 
        end_time = ?, 
        base_price = ?, 
        vip_price = ?, 
        couple_price = ?
      WHERE id = ? AND cancelled_at IS NULL
    `;

    const values = [
      showtime.roomId,
      showtime.startTime, // Object Date, driver mysql2 sẽ tự map
      showtime.endTime,
      showtime.basePrice,
      showtime.vipPrice,
      showtime.couplePrice,
      showtime.id,
    ];

    const [result] = await this.pool.query(query, values);

    // Đảm bảo là có dòng bị tác động (nghĩa là suất chiếu tồn tại và chưa bị huỷ)
    if (result.affectedRows === 0) {
      throw new Error(
        "Không tìm thấy suất chiếu hoặc suất chiếu đã bị huỷ từ trước.",
      );
    }

    return showtime;
  }

  // ── Private helpers ───────────────────────────────────────────────

  // Format Date object → "YYYY-MM-DD" cho MySQL DATE comparison
  #formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  #rowToMovie(row) {
    return Movie.fromPersistence({
      id: row.movie__id,
      title: row.movie__title,
      duration: row.movie__duration,
      genres: this.#parseJSON(row.movie__genres, []),
      directors: this.#parseJSON(row.movie__directors, []),
      release_date: row.movie__release_date,
      end_date: row.movie__end_date,
      poster_url: row.movie__poster_url,
      description: row.movie__description,
      age_rating: row.movie__age_rating,
      language: row.movie__language,
      created_at: row.movie__created_at,
    });
  }

  #rowToRoom(row) {
    return Room.fromPersistence({
      id: row.room__id,
      cinema_id: row.room__cinema_id,
      name: row.room__name,
      type: row.room__type,
      total_rows: row.room__total_rows,
      seats_per_row: row.room__seats_per_row,
      created_at: row.room__created_at,
    });
  }

  #rowToCinema(row) {
    return Cinema.fromPersistence({
      id: row.cinema__id,
      name: row.cinema__name,
      address: row.cinema__address,
      city: row.cinema__city,
      phone: row.cinema__phone,
      image_url: row.cinema__image_url,
      created_at: row.cinema__created_at,
    });
  }

  // Parse JSON an toàn — tránh crash nếu data trong DB bị corrupt
  #parseJSON(value, fallback) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}

export default MySQLShowtimeRepository;
