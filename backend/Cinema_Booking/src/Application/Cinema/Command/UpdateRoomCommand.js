import AppError from "../../../Domain/Errors/AppError.js";

const ROOM_TYPES = ["STANDARD", "VIP", "IMAX"];

class UpdateRoomCommand {
  constructor({ id, name, type, totalRows, seatsPerRow }) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    const updatableFields = [name, type, totalRows, seatsPerRow];
    if (updatableFields.every((f) => f === undefined)) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length < 1) {
        throw new AppError("name không được để trống", 400);
      }
    }

    if (type !== undefined) {
      if (!ROOM_TYPES.includes(type)) {
        throw new AppError(
          `type must be one of: ${ROOM_TYPES.join(", ")}`,
          400,
        );
      }
    }

    if (totalRows !== undefined) {
      if (!Number.isInteger(Number(totalRows)) || Number(totalRows) <= 0) {
        throw new AppError("totalRows must be a positive integer", 400);
      }
      if (Number(totalRows) > 26) {
        throw new AppError("totalRows không được vượt quá 26 (A-Z)", 400);
      }
    }

    if (seatsPerRow !== undefined) {
      if (!Number.isInteger(Number(seatsPerRow)) || Number(seatsPerRow) <= 0) {
        throw new AppError("seatsPerRow must be a positive integer", 400);
      }
      if (Number(seatsPerRow) > 50) {
        throw new AppError("seatsPerRow không được vượt quá 50", 400);
      }
    }

    this.id = Number(id);
    this.name = name !== undefined ? name.trim() : undefined;
    this.type = type;
    this.totalRows = totalRows !== undefined ? Number(totalRows) : undefined;
    this.seatsPerRow =
      seatsPerRow !== undefined ? Number(seatsPerRow) : undefined;
  }
}

export default UpdateRoomCommand;
