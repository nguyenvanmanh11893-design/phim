// src/Infrastructure/Http/Repositories/MySQLRatingRepository.js
import RatingRepositoryInterface from "../../../Domain/Rating/Repository/RatingRepositoryInterface.js";
import Rating from "../../../Domain/Rating/Entity/Rating.js";

class MySQLRatingRepository extends RatingRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Lưu rating mới ───────────────────────────────────────────────────
  async save(rating) {
    const { user_id, movie_id, score, review, created_at } =
      rating.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO ratings (user_id, movie_id, score, review, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, movie_id, score, review, created_at],
    );

    return Rating.fromPersistence({
      id: result.insertId,
      user_id,
      movie_id,
      score,
      review,
      created_at,
    });
  }

  // ── Tìm rating theo userId + movieId ──────────────────────────────────
  // Dùng trong CreateRatingHandler để kiểm tra đã rate chưa
  async findByUserIdAndMovieId(userId, movieId) {
    const [rows] = await this.pool.execute(
      `SELECT id, user_id, movie_id, score, review, created_at
       FROM ratings
       WHERE user_id = ? AND movie_id = ?
       LIMIT 1`,
      [userId, movieId],
    );

    if (rows.length === 0) return null;

    return Rating.fromPersistence(rows[0]);
  }

  // ── Lấy danh sách ratings theo movieId — có phân trang ───────────────
  // JOIN users để lấy tên người review — client không cần gọi thêm API
  async findByMovieId(movieId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const [rows] = await this.pool.execute(
      `SELECT r.id, r.user_id, r.movie_id, r.score, r.review, r.created_at,
              u.name AS user_name, u.avatar_url AS user_avatar
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.movie_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [movieId, limit, offset],
    );

    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total FROM ratings WHERE movie_id = ?`,
      [movieId],
    );

    return {
      data: rows.map((row) => this.#toEntityWithUser(row)),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // ── Tính điểm trung bình + tổng số ratings của 1 phim ────────────────
  // Dùng trong GetMovieRatingsHandler và có thể dùng trong GetMovieHandler
  async getStatsByMovieId(movieId) {
    const [[row]] = await this.pool.execute(
      `SELECT
         ROUND(AVG(score), 1) AS average,
         COUNT(*)             AS total
       FROM ratings
       WHERE movie_id = ?`,
      [movieId],
    );

    return {
      average: row.average ? Number(row.average) : 0,
      total: Number(row.total),
    };
  }

  // ── Kiểm tra tồn tại nhẹ ─────────────────────────────────────────────
  async existsByUserIdAndMovieId(userId, movieId) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM ratings
       WHERE user_id = ? AND movie_id = ?
       LIMIT 1`,
      [userId, movieId],
    );

    return rows.length > 0;
  }

  // ── Private helpers ───────────────────────────────────────────────────

  // Rating bình thường — không kèm thông tin user
  #toEntity(row) {
    return Rating.fromPersistence({
      id: row.id,
      user_id: row.user_id,
      movie_id: row.movie_id,
      score: row.score,
      review: row.review,
      created_at: row.created_at,
    });
  }

  // Rating kèm thông tin user — dùng trong findByMovieId
  // Gắn thêm userName + userAvatar vào toJSON() output thông qua object mở rộng
  // Không tạo thêm Entity riêng — giữ đơn giản, chỉ enrich ở tầng repo
  #toEntityWithUser(row) {
    const rating = this.#toEntity(row);

    // Monkey-patch toJSON để thêm thông tin user vào response
    // mà không làm phức tạp Domain Entity
    const originalToJSON = rating.toJSON.bind(rating);
    rating.toJSON = () => ({
      ...originalToJSON(),
      userName: row.user_name,
      userAvatar: row.user_avatar ?? null,
    });

    return rating;
  }
}

export default MySQLRatingRepository;
