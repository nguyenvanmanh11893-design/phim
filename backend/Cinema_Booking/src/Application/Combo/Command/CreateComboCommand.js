import AppError from "../../../Domain/Errors/AppError.js";

class CreateComboCommand {
  constructor({ name, description, price, imageUrl }) {
    // ── Bắt buộc ──────────────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      throw new AppError(
        "Tên combo là bắt buộc và phải có ít nhất 2 ký tự",
        400,
      );
    }

    if (
      price === undefined ||
      price === null ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      throw new AppError("Giá combo là bắt buộc và phải là số không âm", 400);
    }

    // ── Không bắt buộc ────────────────────────────────────────────────
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      throw new AppError("Mô tả phải là một chuỗi văn bản", 400);
    }

    if (imageUrl !== undefined && imageUrl !== null) {
      if (typeof imageUrl !== "string") {
        throw new AppError("URL ảnh phải là một chuỗi", 400);
      }
      try {
        new URL(imageUrl);
      } catch {
        throw new AppError("URL ảnh không hợp lệ", 400);
      }
    }

    this.name = name.trim();
    this.price = Number(price);
    this.description = description ? description.trim() : null;
    this.imageUrl = imageUrl ? imageUrl.trim() : null;
  }
}

export default CreateComboCommand;
