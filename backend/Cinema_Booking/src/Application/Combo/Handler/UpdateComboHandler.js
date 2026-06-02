import AppError from "../../../Domain/Errors/AppError.js";

class UpdateComboHandler {
  constructor(comboRepository) {
    this.comboRepository = comboRepository;
  }

  async execute(command) {
    const { id, name, description, price, imageUrl, isActive } = command;

    const existing = await this.comboRepository.findById(id);

    if (!existing) {
      throw new AppError(`Combo với id=${id} không tồn tại`, 404);
    }

    // Xử lý cập nhật thông tin chung
    try {
      existing.updateDetails({
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? price : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
      });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // Xử lý activate/deactivate riêng (như đã định nghĩa ở Entity)
    if (isActive !== undefined) {
      if (isActive) {
        existing.activate();
      } else {
        existing.deactivate();
      }
    }

    const updatedCombo = await this.comboRepository.update(existing);
    return updatedCombo.toJSON();
  }
}

export default UpdateComboHandler;
