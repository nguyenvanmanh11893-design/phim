import Combo from "../../../Domain/Combo/Entity/Combo.js";
import AppError from "../../../Domain/Errors/AppError.js";

class CreateComboHandler {
  constructor(comboRepository) {
    this.comboRepository = comboRepository;
  }

  async execute(command) {
    const { name, description, price, imageUrl } = command;

    let combo;
    try {
      combo = Combo.create({ name, description, price, imageUrl });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    const savedCombo = await this.comboRepository.save(combo);
    return savedCombo.toJSON();
  }
}

export default CreateComboHandler;
