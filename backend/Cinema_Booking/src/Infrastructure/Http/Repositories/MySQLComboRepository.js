import ComboRepositoryInterface from "../../../Domain/Combo/Repository/ComboRepositoryInterface.js";
import Combo from "../../../Domain/Combo/Entity/Combo.js";

class MySQLComboRepository extends ComboRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm combo theo id ─────────────────────────────────────────────
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, name, description, price, image_url, is_active, created_at
       FROM combos
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;
    return this.#toEntity(rows[0]);
  }

  // ── Tìm nhiều combo theo mảng IDs (dùng khi đặt vé) ───────────────
  async findByIds(ids) {
    if (!ids || ids.length === 0) return [];

    // Tạo placeholders ?,?,? tùy theo số lượng ID
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await this.pool.execute(
      `SELECT id, name, description, price, image_url, is_active, created_at
       FROM combos
       WHERE id IN (${placeholders})`,
      ids,
    );

    return rows.map((row) => this.#toEntity(row));
  }

  // ── Lấy danh sách combo (có phân trang, filter isActive) ──────────
  async findAll({ page = 1, limit = 20, isActive = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (isActive !== undefined && isActive !== null) {
      conditions.push(`is_active = ?`);
      params.push(isActive ? 1 : 0);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await this.pool.execute(
      `SELECT id, name, description, price, image_url, is_active, created_at
       FROM combos
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const [[{ total }]] = await this.pool.execute(
      `SELECT COUNT(*) AS total FROM combos ${whereClause}`,
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

  // ── Lưu combo mới ─────────────────────────────────────────────────
  async save(combo) {
    const { name, description, price, image_url, is_active, created_at } =
      combo.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO combos (name, description, price, image_url, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, image_url, is_active, created_at],
    );

    return Combo.fromPersistence({
      id: result.insertId,
      name,
      description,
      price,
      image_url,
      is_active,
      created_at,
    });
  }

  // ── Cập nhật combo ────────────────────────────────────────────────
  async update(combo) {
    const { name, description, price, image_url, is_active } =
      combo.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE combos
       SET name        = ?,
           description = ?,
           price       = ?,
           image_url   = ?,
           is_active   = ?
       WHERE id = ?`,
      [name, description, price, image_url, is_active, combo.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Combo với id=${combo.id} không tồn tại`);
    }

    return combo;
  }

  // ── Xóa combo ─────────────────────────────────────────────────────
  async delete(id) {
    const [result] = await this.pool.execute(
      `DELETE FROM combos WHERE id = ?`,
      [id],
    );
    return result.affectedRows > 0;
  }

  // ── Kiểm tra tồn tại nhẹ ──────────────────────────────────────────
  async existsById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM combos WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  }

  // ── Private helper — map raw DB row → Combo entity ────────────────
  #toEntity(row) {
    return Combo.fromPersistence({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      image_url: row.image_url,
      is_active: row.is_active,
      created_at: row.created_at,
    });
  }
}

export default MySQLComboRepository;
