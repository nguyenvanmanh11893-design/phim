import AppError from "../../../Domain/Errors/AppError.js";

class UpdateCinemaCommand {
  constructor({ id, name, address, city, phone, imageUrl }) {
    // ── id bắt buộc ───────────────────────────────────────────────────
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id is required and must be a positive integer", 400);
    }

    // ── Phải có ít nhất 1 field để update ─────────────────────────────
    const updatableFields = [name, address, city, phone, imageUrl];
    if (updatableFields.every((f) => f === undefined)) {
      throw new AppError("At least one field must be provided for update", 400);
    }

    // ── Validate từng field nếu được truyền vào ───────────────────────
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        throw new AppError("name phải có ít nhất 2 ký tự", 400);
      }
    }

    if (address !== undefined) {
      if (
        !address ||
        typeof address !== "string" ||
        address.trim().length < 5
      ) {
        throw new AppError("address phải có ít nhất 5 ký tự", 400);
      }
    }

    if (city !== undefined) {
      if (!city || typeof city !== "string" || city.trim().length < 2) {
        throw new AppError("city phải có ít nhất 2 ký tự", 400);
      }
    }

    if (phone !== undefined && phone !== null) {
      if (typeof phone !== "string" || !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
        throw new AppError("phone không đúng định dạng", 400);
      }
    }

    if (imageUrl !== undefined && imageUrl !== null) {
      if (typeof imageUrl !== "string") {
        throw new AppError("imageUrl phải là string", 400);
      }
      try {
        new URL(imageUrl);
      } catch {
        throw new AppError("imageUrl không phải URL hợp lệ", 400);
      }
    }

    this.id = Number(id);
    this.name = name !== undefined ? name.trim() : undefined;
    this.address = address !== undefined ? address.trim() : undefined;
    this.city = city !== undefined ? city.trim() : undefined;
    this.phone = phone !== undefined ? (phone?.trim() ?? null) : undefined;
    this.imageUrl =
      imageUrl !== undefined ? (imageUrl?.trim() ?? null) : undefined;
  }
}

export default UpdateCinemaCommand;
