import CinemaRepositoryInterface from "../../../Domain/Cinema/Repository/CinemaRepositoryInterface.js";
import Cinema from "../../../Domain/Cinema/Entity/Cinema.js";

class MySQLCinemaRepository extends CinemaRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm rạp theo id ───────────────────────────────────────────────
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, name, address, city, phone, image_url, created_at
       FROM cinemas
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Lấy danh sách rạp — filter theo city, có phân trang ───────────
  async findAll({ page = 1, limit = 20, city = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (city) {
      conditions.push(`city = ?`);
      params.push(city);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await this.pool.execute(
      `SELECT id, name, address, city, phone, image_url, created_at
       FROM cinemas
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total FROM cinemas ${whereClause}`,
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

  // ── Kiểm tra trùng tên + thành phố — dùng trong CreateCinemaHandler ─
  async existsByNameAndCity(name, city) {
    const [rows] = await this.pool.execute(
      `SELECT 1
       FROM cinemas
       WHERE name = ? AND city = ?
       LIMIT 1`,
      [name, city],
    );

    return rows.length > 0;
  }

  // ── Lưu rạp mới ───────────────────────────────────────────────────
  async save(cinema) {
    const { name, address, city, phone, image_url, created_at } =
      cinema.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO cinemas (name, address, city, phone, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, address, city, phone, image_url, created_at],
    );

    return Cinema.fromPersistence({
      id: result.insertId,
      name,
      address,
      city,
      phone,
      image_url,
      created_at,
    });
  }

  // ── Cập nhật rạp ──────────────────────────────────────────────────
  async update(cinema) {
    const { name, address, city, phone, image_url } = cinema.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE cinemas
       SET name      = ?,
           address   = ?,
           city      = ?,
           phone     = ?,
           image_url = ?
       WHERE id = ?`,
      [name, address, city, phone, image_url, cinema.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Cinema với id=${cinema.id} không tồn tại`);
    }

    return cinema;
  }

  // ── Xóa rạp theo id ───────────────────────────────────────────────
  async delete(id) {
    const [result] = await this.pool.execute(
      `DELETE FROM cinemas WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  }

  // ── Kiểm tra tồn tại nhẹ — không fetch toàn bộ row ───────────────
  async existsById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM cinemas WHERE id = ? LIMIT 1`,
      [id],
    );

    return rows.length > 0;
  }

  // ── Private helper — map raw DB row → Cinema entity ───────────────
  #toEntity(row) {
    return Cinema.fromPersistence({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      phone: row.phone,
      image_url: row.image_url,
      created_at: row.created_at,
    });
  }
}

export default MySQLCinemaRepository;
