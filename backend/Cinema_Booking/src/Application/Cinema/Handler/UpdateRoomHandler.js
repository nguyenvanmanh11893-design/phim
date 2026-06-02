import AppError from "../../../Domain/Errors/AppError.js";
import Seat from "../../../Domain/Cinema/Entity/Seat.js";

class UpdateRoomHandler {
  constructor(roomRepository, seatRepository) {
    this.roomRepository = roomRepository;
    this.seatRepository = seatRepository;
  }

  async execute(command) {
    const { id, name, type, totalRows, seatsPerRow } = command;

    // ── Bước 1: Fetch entity hiện tại ─────────────────────────────────
    const existing = await this.roomRepository.findById(id);

    if (!existing) {
      throw new AppError(`Room với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra trùng tên nếu đổi name ───────────────────────
    if (name !== undefined && name !== existing.name) {
      const alreadyExists = await this.roomRepository.existsByNameAndCinemaId(
        name,
        existing.cinemaId,
      );

      if (alreadyExists) {
        throw new AppError(
          `Phòng "${name}" đã tồn tại trong rạp id=${existing.cinemaId}`,
          409,
        );
      }
    }

    // ── Bước 3: Phát hiện thay đổi kích thước phòng ───────────────────
    const gridChanged =
      (totalRows !== undefined && totalRows !== existing.totalRows) ||
      (seatsPerRow !== undefined && seatsPerRow !== existing.seatsPerRow);

    // ── Bước 4: Merge field ───────────────────────────────────────────
    existing.name = name !== undefined ? name : existing.name;
    existing.type = type !== undefined ? type : existing.type;
    existing.totalRows =
      totalRows !== undefined ? totalRows : existing.totalRows;
    existing.seatsPerRow =
      seatsPerRow !== undefined ? seatsPerRow : existing.seatsPerRow;

    // ── Bước 5: Nếu grid thay đổi → rebuild toàn bộ ghế ──────────────
    // Không thể patch từng ghế vì số hàng/số cột thay đổi hoàn toàn
    // → xóa hết ghế cũ, tạo lại theo kích thước mới
    // Cần transaction để đảm bảo atomicity
    if (!gridChanged) {
      const updatedRoom = await this.roomRepository.update(existing);
      return updatedRoom.toJSON();
    }
    return await this.roomRepository.withTransaction(async () => {
      const updatedRoom = await this.roomRepository.update(existing);
      await this.seatRepository.deleteByRoomId(id);
      const newSeats = this.#generateSeats(
        id,
        existing.totalRows,
        existing.seatsPerRow,
      );
      const savedSeats = await this.seatRepository.saveMany(newSeats);
      return {
        ...updatedRoom.toJSON(),
        seats: savedSeats.map((seat) => seat.toJSON()),
      };
    });
  }

  // ── Generate Seat entities theo grid rows × seatsPerRow ───────────
  #generateSeats(roomId, totalRows, seatsPerRow) {
    const seats = [];

    for (let r = 0; r < totalRows; r++) {
      const row = String.fromCharCode(65 + r);

      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push(
          Seat.create({
            roomId,
            row,
            number: n,
            type: "NORMAL",
          }),
        );
      }
    }

    return seats;
  }
}

export default UpdateRoomHandler;
