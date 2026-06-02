import AppError from "../../../Domain/Errors/AppError.js";

class GetRoomHandler {
  constructor(roomRepository) {
    this.roomRepository = roomRepository;
  }

  async execute(query) {
    const { id } = query;

    const room = await this.roomRepository.findById(id);

    if (!room) {
      throw new AppError(`Room với id=${id} không tồn tại`, 404);
    }

    return room.toJSON();
  }
}

export default GetRoomHandler;
