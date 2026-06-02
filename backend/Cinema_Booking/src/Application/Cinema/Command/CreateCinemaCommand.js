import AppError from "../../../Domain/Errors/AppError.js";

class CreateCinemaCommand {
  constructor({ name, address, city, phone, imageUrl }) {
    // ── Required fields ───────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      throw new AppError("name là bắt buộc và phải có ít nhất 2 ký tự", 400);
    }
    if (!address || typeof address !== "string" || address.trim().length < 5) {
      throw new AppError("address là bắt buộc và phải có ít nhất 5 ký tự", 400);
    }
    if (!city || typeof city !== "string" || city.trim().length < 2) {
      throw new AppError("city là bắt buộc và phải có ít nhất 2 ký tự", 400);
    }

    // ── Optional fields ───────────────────────────────────────────────
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

    this.name = name.trim();
    this.address = address.trim();
    this.city = city.trim();
    this.phone = phone?.trim() ?? null;
    this.imageUrl = imageUrl?.trim() ?? null;
  }
}

export default CreateCinemaCommand;
