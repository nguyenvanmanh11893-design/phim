import AppError from "../../../Domain/Errors/AppError.js";

class DeleteRoomHandler {
  constructor(roomRepository) {
    this.roomRepository = roomRepository;
  }

  async execute(command) {
    const { id } = command;

    // ── Bước 1: Kiểm tra tồn tại ──────────────────────────────────────
    const exists = await this.roomRepository.existsById(id);

    if (!exists) {
      throw new AppError(`Room với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Xóa — seats tự xóa theo nhờ ON DELETE CASCADE ────────
    await this.roomRepository.delete(id);

    return { message: `Xóa phòng id=${id} thành công` };
  }
}

export default DeleteRoomHandler;
