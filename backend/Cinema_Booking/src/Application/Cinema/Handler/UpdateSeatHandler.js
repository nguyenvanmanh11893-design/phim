import AppError from "../../../Domain/Errors/AppError.js";

class UpdateSeatHandler {
  constructor(seatRepository) {
    this.seatRepository = seatRepository;
  }

  async execute(command) {
    const { id, type, isActive } = command;

    // ── Bước 1: Fetch entity hiện tại ─────────────────────────────────
    const existing = await this.seatRepository.findById(id);

    if (!existing) {
      throw new AppError(`Seat với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Merge ─────────────────────────────────────────────────
    existing.type = type !== undefined ? type : existing.type;
    existing.isActive = isActive !== undefined ? isActive : existing.isActive;

    // ── Bước 3: Lưu vào DB ────────────────────────────────────────────
    const updatedSeat = await this.seatRepository.update(existing);

    return updatedSeat.toJSON();
  }
}

export default UpdateSeatHandler;
