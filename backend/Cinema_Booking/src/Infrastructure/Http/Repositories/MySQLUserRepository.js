// Infrastructure/Persistence/Repositories/MySQLUserRepository.js
import UserRepositoryInterface from "../../../Domain/User/Repository/UserRepositoryInterface.js";
import User from "../../../Domain/User/Entity/User.js";

class MySQLUserRepository extends UserRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm user theo email — dùng trong LoginHandler ─────────────────
  async findByEmail(email) {
    const [rows] = await this.pool.execute(
      `SELECT id, name, email, password_hash, role,
              avatar_url, phone, date_of_birth, updated_at, created_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Tìm user theo id — dùng trong authMiddleware ──────────────────
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, name, email, password_hash, role,
              avatar_url, phone, date_of_birth, updated_at, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Kiểm tra email tồn tại — dùng trong RegisterHandler ──────────
  async existsByEmail(email) {
    const [rows] = await this.pool.execute(
      `SELECT 1
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    return rows.length > 0;
  }

  // ── Lưu user mới — dùng trong RegisterHandler ────────────────────
  async save(user) {
    const {
      name,
      email,
      passwordHash,
      role,
      avatar_url,
      phone,
      date_of_birth,
      updated_at,
      createdAt,
    } = user.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO users
         (name, email, password_hash, role, avatar_url, phone, date_of_birth, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        passwordHash,
        role,
        avatar_url,
        phone,
        date_of_birth,
        updated_at,
        createdAt,
      ],
    );

    return User.fromPersistence({
      id: result.insertId,
      name,
      email,
      passwordHash,
      role,
      avatar_url,
      phone,
      date_of_birth,
      updated_at,
      createdAt,
    });
  }

  // ── Cập nhật user — dùng khi đổi tên, đổi password, update profile ─
  async update(user) {
    const {
      name,
      passwordHash,
      role,
      avatar_url,
      phone,
      date_of_birth,
      updated_at,
    } = user.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE users
       SET name          = ?,
           password_hash = ?,
           role          = ?,
           avatar_url    = ?,
           phone         = ?,
           date_of_birth = ?,
           updated_at    = ?
       WHERE id = ?`,
      [
        name,
        passwordHash,
        role,
        avatar_url,
        phone,
        date_of_birth,
        updated_at,
        user.id,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error(`User với id=${user.id} không tồn tại`);
    }

    return user;
  }

  // ── Lấy danh sách user có phân trang — dùng cho trang Admin ───────
  async findAll({ page = 1, limit = 20, role = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (role) {
      conditions.push(`role = ?`);
      params.push(role);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await this.pool.execute(
      `SELECT id, name, email, role,
            avatar_url, phone, date_of_birth, updated_at, created_at
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
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

  // ── Private helper — map raw DB row → User entity ─────────────────
  #toEntity(row) {
    return User.fromPersistence({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      avatar_url: row.avatar_url,
      phone: row.phone,
      date_of_birth: row.date_of_birth,
      updated_at: row.updated_at,
      createdAt: row.created_at,
    });
  }
}

export default MySQLUserRepository;
