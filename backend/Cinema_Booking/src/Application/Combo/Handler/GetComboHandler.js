import AppError from "../../../Domain/Errors/AppError.js";

class GetComboHandler {
  constructor(comboRepository) {
    this.comboRepository = comboRepository;
  }

  async execute(query) {
    const { id } = query;

    const combo = await this.comboRepository.findById(id);

    if (!combo) {
      throw new AppError(`Combo với id=${id} không tồn tại`, 404);
    }

    return combo.toJSON();
  }
}

export default GetComboHandler;
