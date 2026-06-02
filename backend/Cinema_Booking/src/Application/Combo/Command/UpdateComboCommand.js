import AppError from "../../../Domain/Errors/AppError.js";

class UpdateComboCommand {
  constructor({ id, name, description, price, imageUrl, isActive }) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      throw new AppError("id là bắt buộc và phải là số nguyên dương", 400);
    }

    const updatableFields = [name, description, price, imageUrl, isActive];
    if (updatableFields.every((f) => f === undefined)) {
      throw new AppError("Phải cung cấp ít nhất một trường để cập nhật", 400);
    }

    if (
      name !== undefined &&
      (!name || typeof name !== "string" || name.trim().length < 2)
    ) {
      throw new AppError("Tên combo phải có ít nhất 2 ký tự", 400);
    }

    if (
      price !== undefined &&
      (!Number.isFinite(Number(price)) || Number(price) < 0)
    ) {
      throw new AppError("Giá combo phải là số không âm", 400);
    }

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean" &&
      isActive !== "true" &&
      isActive !== "false"
    ) {
      throw new AppError("isActive phải là kiểu boolean", 400);
    }

    this.id = Number(id);
    this.name = name !== undefined ? name.trim() : undefined;
    this.description =
      description !== undefined ? (description?.trim() ?? null) : undefined;
    this.price = price !== undefined ? Number(price) : undefined;
    this.imageUrl =
      imageUrl !== undefined ? (imageUrl?.trim() ?? null) : undefined;

    if (isActive !== undefined) {
      this.isActive = isActive === true || isActive === "true";
    }
  }
}

export default UpdateComboCommand;
