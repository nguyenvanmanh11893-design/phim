// src/Application/Booking/Command/ConfirmBookingCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

class ConfirmBookingCommand {
  constructor({ id, userId }) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    this.id = Number(id);
    this.userId = Number(userId);
  }
}

export default ConfirmBookingCommand;
