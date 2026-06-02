// Infrastructure/Http/Repositories/MySQLMovieRepository.js
import MovieRepositoryInterface from "../../../Domain/Movie/Repository/MovieRepositoryInterface.js";
import Movie from "../../../Domain/Movie/Entity/Movie.js";

class MySQLMovieRepository extends MovieRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm phim theo id ───────────────────────────────────────────────
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, title, duration, genres, directors,
              release_date, end_date, poster_url, description,
              age_rating, language, created_at
       FROM movies
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Lấy danh sách phim — có filter genre, status và phân trang ─────
  async findAll({ page = 1, limit = 20, genre = null, status = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // ── Filter theo genre ─────────────────────────────────────────────
    // JSON_CONTAINS tìm kiếm trong mảng JSON
    // VD: genres = ["Hành động", "Phiêu lưu"] → JSON_CONTAINS(genres, '"Hành động"')
    if (genre) {
      conditions.push(`JSON_CONTAINS(genres, ?)`);
      params.push(JSON.stringify(genre));
    }

    // ── Filter theo status — tính từ release_date và end_date ─────────
    // Không có cột status trong DB, phải tính động theo thời gian thực
    if (status) {
      const now = new Date();
      switch (status) {
        case "coming_soon":
          conditions.push(`release_date > ?`);
          params.push(now);
          break;
        case "now_showing":
          conditions.push(
            `release_date <= ? AND (end_date IS NULL OR end_date >= ?)`,
          );
          params.push(now, now);
          break;
        case "ended":
          conditions.push(`end_date IS NOT NULL AND end_date < ?`);
          params.push(now);
          break;
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // ── Query lấy data page hiện tại ──────────────────────────────────
    const [rows] = await this.pool.execute(
      `SELECT id, title, duration, genres, directors,
              release_date, end_date, poster_url, description,
              age_rating, language, created_at
       FROM movies
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    // ── Query đếm tổng để tính totalPages ─────────────────────────────
    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total FROM movies ${whereClause}`,
      params,
    );

    return {
      data: rows.map((row) => this.#toEntity(row)),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // ── Lưu phim mới ──────────────────────────────────────────────────
  async save(movie) {
    const {
      title,
      duration,
      genres,
      directors,
      release_date,
      end_date,
      poster_url,
      description,
      age_rating,
      language,
      created_at,
    } = movie.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO movies
         (title, duration, genres, directors, release_date, end_date,
          poster_url, description, age_rating, language, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        duration,
        JSON.stringify(genres),
        JSON.stringify(directors),
        release_date,
        end_date,
        poster_url,
        description,
        age_rating,
        language,
        created_at,
      ],
    );

    return Movie.fromPersistence({
      id: result.insertId,
      title,
      duration,
      genres,
      directors,
      release_date,
      end_date,
      poster_url,
      description,
      age_rating,
      language,
      created_at,
    });
  }

  // ── Update phim — chỉ update các field được truyền vào ────────────
  async update(movie) {
    const {
      title,
      duration,
      genres,
      directors,
      release_date,
      end_date,
      poster_url,
      description,
      age_rating,
      language,
    } = movie.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE movies
       SET title        = ?,
           duration     = ?,
           genres       = ?,
           directors    = ?,
           release_date = ?,
           end_date     = ?,
           poster_url   = ?,
           description  = ?,
           age_rating   = ?,
           language     = ?
       WHERE id = ?`,
      [
        title,
        duration,
        JSON.stringify(genres),
        JSON.stringify(directors),
        release_date,
        end_date,
        poster_url,
        description,
        age_rating,
        language,
        movie.id,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Movie với id=${movie.id} không tồn tại`);
    }

    return movie;
  }

  // ── Xóa phim theo id ──────────────────────────────────────────────
  async delete(id) {
    const [result] = await this.pool.execute(
      `DELETE FROM movies WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  }

  // ── Kiểm tra tồn tại theo id — dùng trong UpdateHandler ──────────
  // Dùng SELECT 1 thay vì SELECT * — chỉ cần biết có tồn tại không
  async existsById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM movies WHERE id = ? LIMIT 1`,
      [id],
    );

    return rows.length > 0;
  }

  async getHotMovies(limit = 5) {
    // Tính score dựa trên số ghế (booking_seats) của các booking đã CONFIRMED
    // Không đếm suất chiếu đã bị hủy hoặc các phim đã kết thúc
    const query = `
      SELECT m.id, m.title, m.duration, m.genres, m.directors,
             m.release_date, m.end_date, m.poster_url, m.description,
             m.age_rating, m.language, m.created_at,
             (
                 COUNT(CASE WHEN b.confirmed_at >= NOW() - INTERVAL 1 DAY THEN bs.id END) * 0.6 +
                 COUNT(CASE WHEN b.confirmed_at >= NOW() - INTERVAL 7 DAY THEN bs.id END) * 0.4
             ) AS hot_score
      FROM movies m
      LEFT JOIN showtimes s ON m.id = s.movie_id AND s.cancelled_at IS NULL
      LEFT JOIN bookings b ON s.id = b.showtime_id AND b.status = 'CONFIRMED'
      LEFT JOIN booking_seats bs ON b.id = bs.booking_id
      WHERE (m.end_date >= NOW() OR m.end_date IS NULL)
      GROUP BY m.id
      ORDER BY hot_score DESC, m.release_date DESC
      LIMIT ?
    `;

    const [rows] = await this.pool.execute(query, [Number(limit)]);

    // Vẫn trả về Entity Movie theo chuẩn DDD bằng helper #toEntity đã có
    return rows.map((row) => this.#toEntity(row));
  }

  // ── Private helper — map raw DB row → Movie entity ─────────────────
  // genres và directors được lưu dạng JSON string trong DB
  // MySQL2 tự parse JSON column nếu driver nhận ra kiểu JSON,
  // nhưng parse thủ công để chắc chắn không bị lỗi trên mọi version
  #toEntity(row) {
    return Movie.fromPersistence({
      id: row.id,
      title: row.title,
      duration: row.duration,
      genres: this.#parseJSON(row.genres, []),
      directors: this.#parseJSON(row.directors, []),
      release_date: row.release_date,
      end_date: row.end_date,
      poster_url: row.poster_url,
      description: row.description,
      age_rating: row.age_rating,
      language: row.language,
      created_at: row.created_at,
    });
  }

  // ── Parse JSON an toàn — tránh crash nếu data trong DB bị corrupt ──
  #parseJSON(value, fallback) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "object") return value; // mysql2 đã parse sẵn
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}

export default MySQLMovieRepository;
