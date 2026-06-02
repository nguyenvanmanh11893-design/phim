import AppError from "../../Errors/AppError.js";

class SeatRepositoryInterface {
  // Dùng trong GetSeatMapHandler — lấy toàn bộ ghế của 1 phòng để vẽ sơ đồ
  async findByRoomId(roomId) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong BookingHandler — verify ghế có thuộc đúng phòng không
  async findByIdAndRoomId(id, roomId) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateRoomHandler — bulk insert toàn bộ ghế sau khi tạo phòng
  async saveMany(seats) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong UpdateSeatHandler — đổi type ghế, deactivate ghế hỏng
  async update(seat) {
    throw new AppError("Not implemented", 500);
  }

  async findById(id) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong DeleteRoomHandler — xóa hết ghế khi xóa phòng
  // (thực ra ON DELETE CASCADE trong DB lo việc này, nhưng vẫn có để gọi tường minh nếu cần)
  async deleteByRoomId(roomId) {
    throw new AppError("Not implemented", 500);
  }

  async existsById(id) {
    throw new AppError("Not implemented", 500);
  }
}

export default SeatRepositoryInterface;
