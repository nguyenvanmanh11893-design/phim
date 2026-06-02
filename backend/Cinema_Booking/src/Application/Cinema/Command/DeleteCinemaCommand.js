import AppError from "../../../Domain/Errors/AppError.js";

class DeleteCinemaCommand {
  constructor({ id }) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    this.id = Number(id);
  }
}

export default DeleteCinemaCommand;
