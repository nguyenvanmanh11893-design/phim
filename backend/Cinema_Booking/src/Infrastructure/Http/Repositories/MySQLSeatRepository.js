import SeatRepositoryInterface from "../../../Domain/Cinema/Repository/SeatRepositoryInterface.js";
import Seat from "../../../Domain/Cinema/Entity/Seat.js";

class MySQLSeatRepository extends SeatRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  // ── Lấy toàn bộ ghế của 1 phòng — dùng trong GetSeatMapHandler ────
  // Sắp xếp theo row ASC, number ASC để vẽ sơ đồ ghế đúng thứ tự
  async findByRoomId(roomId) {
    const [rows] = await this.pool.execute(
      `SELECT id, room_id, row, number, type, is_active, created_at
       FROM seats
       WHERE room_id = ?
       ORDER BY row ASC, number ASC`,
      [roomId],
    );

    return rows.map((row) => this.#toEntity(row));
  }

  // ── Tìm ghế theo id + roomId — dùng trong BookingHandler ──────────
  // Verify ghế có thực sự thuộc phòng đó không, tránh client truyền
  // seatId của phòng khác vào
  async findByIdAndRoomId(id, roomId) {
    const [rows] = await this.pool.execute(
      `SELECT id, room_id, row, number, type, is_active, created_at
       FROM seats
       WHERE id = ? AND room_id = ?
       LIMIT 1`,
      [id, roomId],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Bulk insert toàn bộ ghế sau khi tạo phòng ─────────────────────
  // Dùng multi-row INSERT thay vì loop từng ghế — phòng 10×20 = 200 ghế
  // mà insert từng cái sẽ tạo 200 round-trip DB không cần thiết
  async saveMany(seats) {
    if (seats.length === 0) return [];

    // Xây placeholders: (?,?,?,?,?,?),(?,?,?,?,?,?),...
    const placeholders = seats.map(() => `(?,?,?,?,?,?)`).join(",");

    const values = seats.flatMap((seat) => {
      const { room_id, row, number, type, is_active, created_at } =
        seat.toPersistence();
      return [room_id, row, number, type, is_active, created_at];
    });

    const [result] = await this.pool.execute(
      `INSERT INTO seats (room_id, row, number, type, is_active, created_at)
       VALUES ${placeholders}`,
      values,
    );

    // MySQL trả về insertId của row đầu tiên — các row sau tăng tuần tự
    // Reconstruct entities với id thật từ AUTO_INCREMENT
    const firstId = result.insertId;

    return seats.map((seat, index) => {
      const { room_id, row, number, type, is_active, created_at } =
        seat.toPersistence();

      return Seat.fromPersistence({
        id: firstId + index,
        room_id,
        row,
        number,
        type,
        is_active,
        created_at,
      });
    });
  }

  // ── Cập nhật ghế — đổi type hoặc deactivate ghế hỏng ─────────────
  // Không cho đổi room_id, row, number — vị trí ghế là cố định
  async update(seat) {
    const { type, is_active } = seat.toPersistence();

    const [result] = await this.pool.execute(
      `UPDATE seats
       SET type      = ?,
           is_active = ?
       WHERE id = ?`,
      [type, is_active, seat.id],
    );

    if (result.affectedRows === 0) {
      throw new Error(`Seat với id=${seat.id} không tồn tại`);
    }

    return seat;
  }

  // ── Xóa toàn bộ ghế của 1 phòng ───────────────────────────────────
  // ON DELETE CASCADE đã lo rồi, method này dùng khi cần soft control
  async deleteByRoomId(roomId) {
    const [result] = await this.pool.execute(
      `DELETE FROM seats WHERE room_id = ?`,
      [roomId],
    );

    return result.affectedRows;
  }

  // ── Kiểm tra tồn tại nhẹ ─────────────────────────────────────────
  async existsById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 1 FROM seats WHERE id = ? LIMIT 1`,
      [id],
    );

    return rows.length > 0;
  }

  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT id, room_id, row, number, type, is_active, created_at
     FROM seats
     WHERE id = ?
     LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  // ── Private helper — map raw DB row → Seat entity ─────────────────
  #toEntity(row) {
    return Seat.fromPersistence({
      id: row.id,
      room_id: row.room_id,
      row: row.row,
      number: row.number,
      type: row.type,
      is_active: row.is_active,
      created_at: row.created_at,
    });
  }
}

export default MySQLSeatRepository;
