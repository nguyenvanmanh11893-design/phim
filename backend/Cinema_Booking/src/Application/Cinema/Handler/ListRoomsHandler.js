import AppError from "../../../Domain/Errors/AppError.js";

class ListRoomsHandler {
  constructor(cinemaRepository, roomRepository) {
    this.cinemaRepository = cinemaRepository;
    this.roomRepository = roomRepository;
  }

  async execute(query) {
    const { cinemaId } = query;

    // ── Kiểm tra rạp tồn tại trước khi lấy danh sách phòng ───────────
    // Tránh trả về mảng rỗng [] gây nhầm lẫn — không biết là rạp không có
    // phòng nào hay rạp không tồn tại
    const cinemaExists = await this.cinemaRepository.existsById(cinemaId);

    if (!cinemaExists) {
      throw new AppError(`Cinema với id=${cinemaId} không tồn tại`, 404);
    }

    const rooms = await this.roomRepository.findByCinemaId(cinemaId);

    return {
      data: rooms.map((room) => room.toJSON()),
      total: rooms.length,
    };
  }
}

export default ListRoomsHandler;
