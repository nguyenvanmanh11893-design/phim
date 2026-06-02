import AppError from "../../../Domain/Errors/AppError.js";

class DeleteCinemaHandler {
  constructor(cinemaRepository) {
    this.cinemaRepository = cinemaRepository;
  }

  async execute(command) {
    const { id } = command;

    const exists = await this.cinemaRepository.existsById(id);

    if (!exists) {
      throw new AppError(`Cinema với id=${id} không tồn tại`, 404);
    }

    // Rooms và Seats tự xóa theo nhờ ON DELETE CASCADE
    await this.cinemaRepository.delete(id);

    return { message: `Xóa rạp id=${id} thành công` };
  }
}

export default DeleteCinemaHandler;
