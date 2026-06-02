import AppError from "../../Errors/AppError.js";

class RoomRepositoryInterface {
  // Dùng trong GetRoomHandler
  async findById(id) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong ListRoomsHandler — lấy tất cả phòng của 1 rạp
  async findByCinemaId(cinemaId) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateShowtimeHandler — cần biết phòng thuộc rạp nào
  async findByIdWithCinema(id) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateRoomHandler — tránh tạo phòng trùng tên trong cùng rạp
  async existsByNameAndCinemaId(name, cinemaId) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateRoomHandler — insert room, trả về entity có id thật
  async save(room) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong UpdateRoomHandler
  async update(room) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong DeleteRoomHandler
  async delete(id) {
    throw new AppError("Not implemented", 500);
  }

  async existsById(id) {
    throw new AppError("Not implemented", 500);
  }

  async withTransaction(fn) {
    throw new AppError("Not implemented", 500);
  }
}

export default RoomRepositoryInterface;
