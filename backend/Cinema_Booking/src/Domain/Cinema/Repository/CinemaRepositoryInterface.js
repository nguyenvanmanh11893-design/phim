import AppError from "../../Errors/AppError.js";

class CinemaRepositoryInterface {
  // Dùng trong GetCinemaHandler
  async findById(id) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong ListCinemasHandler — có filter city, phân trang
  async findAll({ page, limit, city }) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateCinemaHandler — tránh tạo rạp trùng tên + địa chỉ
  async existsByNameAndCity(name, city) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateCinemaHandler
  async save(cinema) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong UpdateCinemaHandler
  async update(cinema) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong DeleteCinemaHandler
  async delete(id) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong UpdateCinemaHandler, DeleteCinemaHandler — kiểm tra tồn tại nhẹ hơn findById
  async existsById(id) {
    throw new AppError("Not implemented", 500);
  }
}

export default CinemaRepositoryInterface;
