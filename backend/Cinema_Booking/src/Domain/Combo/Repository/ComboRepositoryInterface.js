// src/Domain/Combo/Repository/ComboRepositoryInterface.js
import AppError from "../../Errors/AppError.js";

/**
 * Interface định nghĩa contract cho tầng persistence của Combo.
 *
 * Tầng Domain không biết gì về MySQL —
 * MySQLComboRepository sẽ implement các method này.
 */
class ComboRepositoryInterface {
  // Tìm kiếm combo theo ID
  async findById(id) {
    throw new AppError("Not implemented", 500);
  }

  // Lấy danh sách combo (dành cho người dùng xem menu và admin quản lý)
  async findAll({ page, limit, isActive }) {
    throw new AppError("Not implemented", 500);
  }

  // Lưu combo mới
  async save(combo) {
    throw new AppError("Not implemented", 500);
  }

  // Cập nhật thông tin combo
  async update(combo) {
    throw new AppError("Not implemented", 500);
  }

  // Xóa combo (có thể dùng soft delete hoặc xoá cứng tùy logic ở repo)
  async delete(id) {
    throw new AppError("Not implemented", 500);
  }

  // Kiểm tra tồn tại nhanh chóng (tránh query thừa dữ liệu)
  async existsById(id) {
    throw new AppError("Not implemented", 500);
  }

  // Lấy nhiều combo cùng lúc bằng mảng IDs (Hữu ích khi create booking)
  async findByIds(ids) {
    throw new AppError("Not implemented", 500);
  }
}

export default ComboRepositoryInterface;
