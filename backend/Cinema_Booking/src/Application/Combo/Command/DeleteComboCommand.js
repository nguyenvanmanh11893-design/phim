import AppError from "../../../Domain/Errors/AppError.js";

class DeleteComboCommand {
  constructor({ id }) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id là bắt buộc và phải là số nguyên dương", 400);
    }
    this.id = Number(id);
  }
}

export default DeleteComboCommand;
