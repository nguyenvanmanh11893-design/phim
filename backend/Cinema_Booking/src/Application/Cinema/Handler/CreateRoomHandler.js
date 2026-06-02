import AppError from "../../../Domain/Errors/AppError.js";
import Room from "../../../Domain/Cinema/Entity/Room.js";
import Seat from "../../../Domain/Cinema/Entity/Seat.js";

class CreateRoomHandler {
  constructor(cinemaRepository, roomRepository, seatRepository) {
    this.cinemaRepository = cinemaRepository;
    this.roomRepository = roomRepository;
    this.seatRepository = seatRepository;
  }

  async execute(command) {
    const { cinemaId, name, type, totalRows, seatsPerRow } = command;

    // ── Bước 1: Kiểm tra rạp tồn tại ─────────────────────────────────
    const cinemaExists = await this.cinemaRepository.existsById(cinemaId);

    if (!cinemaExists) {
      throw new AppError(`Cinema với id=${cinemaId} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra trùng tên phòng trong cùng rạp ──────────────
    const alreadyExists = await this.roomRepository.existsByNameAndCinemaId(
      name,
      cinemaId,
    );

    if (alreadyExists) {
      throw new AppError(
        `Phòng "${name}" đã tồn tại trong rạp id=${cinemaId}`,
        409,
      );
    }

    // ── Bước 3: Tạo Room entity ───────────────────────────────────────
    let room;
    try {
      room = Room.create({ cinemaId, name, type, totalRows, seatsPerRow });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 4: Lưu Room + bulk insert Seats trong transaction ────────
    // Dùng connection riêng để đảm bảo atomicity —
    // nếu saveMany thất bại thì room cũng không được tạo
    return await this.roomRepository.withTransaction(async () => {
      const savedRoom = await this.roomRepository.save(room);
      const seats = this.#generateSeats(savedRoom.id, totalRows, seatsPerRow);
      const savedSeats = await this.seatRepository.saveMany(seats);

      return {
        ...savedRoom.toJSON(),
        seats: savedSeats.map((seat) => seat.toJSON()),
      };
    });
  }

  // ── Generate Seat entities theo grid rows × seatsPerRow ───────────
  // Row A = index 0, B = index 1, ... Z = index 25
  #generateSeats(roomId, totalRows, seatsPerRow) {
    const seats = [];

    for (let r = 0; r < totalRows; r++) {
      const row = String.fromCharCode(65 + r); // 65 = 'A'

      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push(
          Seat.create({
            roomId,
            row,
            number: n,
            type: "NORMAL", // default, admin có thể update từng ghế sau
          }),
        );
      }
    }

    return seats;
  }
}

export default CreateRoomHandler;
