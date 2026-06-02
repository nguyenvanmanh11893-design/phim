import AppError from "../../../Domain/Errors/AppError.js";

class DeleteComboHandler {
  constructor(comboRepository) {
    this.comboRepository = comboRepository;
  }

  async execute(command) {
    const { id } = command;

    const exists = await this.comboRepository.existsById(id);

    if (!exists) {
      throw new AppError(`Combo với id=${id} không tồn tại`, 404);
    }

    await this.comboRepository.delete(id);

    return { message: `Xóa combo id=${id} thành công` };
  }
}

export default DeleteComboHandler;
