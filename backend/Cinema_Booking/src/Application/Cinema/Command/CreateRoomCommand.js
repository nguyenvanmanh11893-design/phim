import AppError from "../../../Domain/Errors/AppError.js";

const ROOM_TYPES = ["STANDARD", "VIP", "IMAX"];

class CreateRoomCommand {
  constructor({ cinemaId, name, type, totalRows, seatsPerRow }) {
    if (
      !cinemaId ||
      !Number.isInteger(Number(cinemaId)) ||
      Number(cinemaId) <= 0
    ) {
      throw new AppError(
        "cinemaId is required and must be a positive integer",
        400,
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      throw new AppError("name là bắt buộc và không được để trống", 400);
    }

    if (type !== undefined && !ROOM_TYPES.includes(type)) {
      throw new AppError(`type must be one of: ${ROOM_TYPES.join(", ")}`, 400);
    }

    if (
      !totalRows ||
      !Number.isInteger(Number(totalRows)) ||
      Number(totalRows) <= 0
    ) {
      throw new AppError(
        "totalRows is required and must be a positive integer",
        400,
      );
    }

    if (
      !seatsPerRow ||
      !Number.isInteger(Number(seatsPerRow)) ||
      Number(seatsPerRow) <= 0
    ) {
      throw new AppError(
        "seatsPerRow is required and must be a positive integer",
        400,
      );
    }

    // ── Giới hạn kích thước phòng hợp lý ─────────────────────────────
    if (Number(totalRows) > 26) {
      throw new AppError("totalRows không được vượt quá 26 (A-Z)", 400);
    }

    if (Number(seatsPerRow) > 50) {
      throw new AppError("seatsPerRow không được vượt quá 50", 400);
    }

    this.cinemaId = Number(cinemaId);
    this.name = name.trim();
    this.type = type ?? "STANDARD";
    this.totalRows = Number(totalRows);
    this.seatsPerRow = Number(seatsPerRow);
  }
}

export default CreateRoomCommand;
