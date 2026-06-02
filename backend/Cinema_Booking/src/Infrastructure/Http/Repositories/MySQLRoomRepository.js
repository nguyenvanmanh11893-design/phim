import RoomRepositoryInterface from "../../../Domain/Cinema/Repository/RoomRepositoryInterface.js";
import Room from "../../../Domain/Cinema/Entity/Room.js";
import Cinema from "../../../Domain/Cinema/Entity/Cinema.js";

class MySQLRoomRepository extends RoomRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Tìm phòng theo id ─────────────────────────────────────────────
  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, cinema_id, name, type, total_rows, seats_per_row, created_at
       FROM rooms
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Tìm phòng + thông tin rạp — dùng trong CreateShowtimeHandler ──
  // JOIN để tránh phải query thêm 1 lần nữa ở Handler
  async findByIdWithCinema(id) {
    const [rows] = await this.pool.execute(
      `SELECT r.id,
              r.cinema_id,
              r.name,
              r.type,
              r.total_rows,
              r.seats_per_row,
              r.created_at,
              c.id         AS cinema__id,
              c.name       AS cinema__name,
              c.address    AS cinema__address,
              c.city       AS cinema__city,
              c.phone      AS cinema__phone,
              c.image_url  AS cinema__image_url,
              c.created_at AS cinema__created_at
       FROM rooms r
       JOIN cinemas c ON c.id = r.cinema_id
       WHERE r.id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    const row = rows[0];

    // Trả về { room, cinema } — Handler tự dùng theo nhu cầu
    return {
      room: this.#toEntity(row),
      cinema: Cinema.fromPersistence({
        id: row.cinema__id,
        name: row.cinema__name,
        address: row.cinema__address,
        city: row.cinema__city,
        phone: row.cinema__phone,
        image_url: row.cinema__image_url,
        created_at: row.cinema__created_at,
      }),
    };
  }

  // ── Lấy tất cả phòng của 1 rạp — dùng trong ListRoomsHandler ──────
  async findByCinemaId(cinemaId) {
    const [rows] = await this.pool.execute(
      `SELECT id, cinema_id, name, type, total_rows, seats_per_row, created_at
       FROM rooms
       WHERE cinema_id = ?
       ORDER BY name ASC`,
      [cinemaId],
    );

    return rows.map((row) => this.#toEntity(row));
  }

  // ── Kiểm tra trùng tên trong cùng rạp — dùng trong CreateRoomHandler
  async existsByNameAndCinemaId(name, cinemaId) {
    const [rows] = await this.pool.execute(
      `SELECT 1
       FROM rooms
       WHERE name = ? AND cinema_id = ?
       LIMIT 1`,
      [name, cinemaId],
    );

    return rows.length > 0;
  }

  // ── Lưu phòng mới ─────────────────────────────────────────────────
  async save(room) {
    const { cinema_id, name, type, total_rows, seats_per_row, created_at } =
      room.toPersistence();

    const [result] = await this.pool.execute(
      `INSERT INTO rooms (cinema_id, name, type, total_rows, seats_per_row, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cinema_id, name, type, total_rows, seats_per_row, created_at],
    );

    return Room.fromPersistence({
      id: result.insertId,
      cinema_id,
      name,
      type,
      total_rows,
      seats_per_row,
      created_at,
    });
  }

  // ── Cập nhật phòng — không cho đổi cinema_id ──────────────────────
  // Phòng đã gắn với rạp rồi thì không di chuyển sang rạp khác
  async update(room) {
    const { name, type, total_rows, seats_per_row } = room.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE rooms
       SET name          = ?,
           type          = ?,
           total_rows    = ?,
           seats_per_row = ?
       WHERE id = ?`,
      [name, type, total_rows, seats_per_row, room.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Room với id=${room.id} không tồn tại`);
    }

    return room;
  }

  // ── Xóa phòng — seats tự xóa theo nhờ ON DELETE CASCADE ──────────
  async delete(id) {
    const [result] = await this.pool.execute(`DELETE FROM rooms WHERE id = ?`, [
      id,
    ]);

    return result.affectedRows > 0;
  }

  // ── Kiểm tra tồn tại nhẹ ─────────────────────────────────────────
  async existsById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM rooms WHERE id = ? LIMIT 1`,
      [id],
    );

    return rows.length > 0;
  }

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

  // ── Private helper — map raw DB row → Room entity ─────────────────
  #toEntity(row) {
    return Room.fromPersistence({
      id: row.id,
      cinema_id: row.cinema_id,
      name: row.name,
      type: row.type,
      total_rows: row.total_rows,
      seats_per_row: row.seats_per_row,
      created_at: row.created_at,
    });
  }
}

export default MySQLRoomRepository;
