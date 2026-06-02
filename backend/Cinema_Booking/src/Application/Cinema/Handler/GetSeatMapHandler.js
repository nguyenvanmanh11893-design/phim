import AppError from "../../../Domain/Errors/AppError.js";

class GetSeatMapHandler {
  constructor(roomRepository, seatRepository) {
    this.roomRepository = roomRepository;
    this.seatRepository = seatRepository;
  }

  async execute(query) {
    const { roomId } = query;

    // ── Bước 1: Kiểm tra phòng tồn tại ───────────────────────────────
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new AppError(`Room với id=${roomId} không tồn tại`, 404);
    }

    // ── Bước 2: Lấy toàn bộ ghế ──────────────────────────────────────
    const seats = await this.seatRepository.findByRoomId(roomId);

    // ── Bước 3: Group ghế theo row — tiện cho client vẽ sơ đồ ────────
    // { A: [{ id, row, number, label, type, isActive }, ...], B: [...] }
    const seatMap = seats.reduce((map, seat) => {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat.toJSON());
      return map;
    }, {});

    return {
      room: room.toJSON(),
      seatMap,
      summary: {
        total: seats.length,
        active: seats.filter((s) => s.isActive).length,
        inactive: seats.filter((s) => !s.isActive).length,
        byType: {
          NORMAL: seats.filter((s) => s.type === "NORMAL").length,
          VIP: seats.filter((s) => s.type === "VIP").length,
          COUPLE: seats.filter((s) => s.type === "COUPLE").length,
        },
      },
    };
  }
}

export default GetSeatMapHandler;
