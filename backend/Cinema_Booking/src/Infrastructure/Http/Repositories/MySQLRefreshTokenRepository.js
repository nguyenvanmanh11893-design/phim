// Infrastructure/Persistence/Repositories/MySQLRefreshTokenRepository.js
import RefreshTokenRepositoryInterface from "../../../Domain/User/Repository/RefreshTokenRepositoryInterface.js";
import RefreshToken from "../../../Domain/User/Entity/RefreshToken.js";

class MySQLRefreshTokenRepository extends RefreshTokenRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Lưu refresh token mới sau khi login ───────────────────────────
  async save(refreshToken) {
    const { user_id, token, expires_at, created_at } =
      refreshToken.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?)`,
      [user_id, token, expires_at, created_at],
    );

    // Trả về entity với id thật từ AUTO_INCREMENT
    return RefreshToken.fromPersistence({
      id: result.insertId,
      userId: user_id,
      token,
      expiresAt: expires_at,
      createdAt: created_at,
    });
  }

  // ── Tìm theo token string — dùng trong RefreshTokenHandler ────────
  async findByToken(token) {
    const [rows] = await this.pool.execute(
      `SELECT id, user_id, token, expires_at, created_at
       FROM refresh_tokens
       WHERE token = ?
       LIMIT 1`,
      [token],
    );

    if (rows.length === 0) return null;

    const row = rows[0];

    return RefreshToken.fromPersistence({
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    });
  }

  // ── Xóa 1 token cụ thể — dùng khi logout thiết bị hiện tại ───────
  async deleteByToken(token) {
    await this.pool.execute(`DELETE FROM refresh_tokens WHERE token = ?`, [
      token,
    ]);
  }

  // ── Xóa tất cả token của 1 user — logout tất cả thiết bị ─────────
  async deleteAllByUserId(userId) {
    await this.pool.execute(`DELETE FROM refresh_tokens WHERE user_id = ?`, [
      userId,
    ]);
  }
}

export default MySQLRefreshTokenRepository;
