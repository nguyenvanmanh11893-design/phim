import AppError from "../../../Domain/Errors/AppError.js";

const SEAT_TYPES = ["NORMAL", "VIP", "COUPLE"];

class UpdateSeatCommand {
  constructor({ id, type, isActive }) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    const updatableFields = [type, isActive];
    if (updatableFields.every((f) => f === undefined)) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    if (type !== undefined) {
      if (!SEAT_TYPES.includes(type)) {
        throw new AppError(
          `type must be one of: ${SEAT_TYPES.join(", ")}`,
          400,
        );
      }
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        throw new AppError("isActive must be a boolean", 400);
      }
    }

    this.id = Number(id);
    this.type = type;
    this.isActive = isActive;
  }
}

export default UpdateSeatCommand;
