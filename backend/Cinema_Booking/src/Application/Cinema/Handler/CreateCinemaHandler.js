import Cinema from "../../../Domain/Cinema/Entity/Cinema.js";
import AppError from "../../../Domain/Errors/AppError.js";

class CreateCinemaHandler {
  constructor(cinemaRepository) {
    this.cinemaRepository = cinemaRepository;
  }

  async execute(command) {
    const { name, address, city, phone, imageUrl } = command;

    // ── Bước 1: Kiểm tra trùng tên trong cùng thành phố ──────────────
    // Cho phép 2 rạp trùng tên ở 2 thành phố khác nhau
    // VD: "Lotte Cinema" ở HCM và "Lotte Cinema" ở Hà Nội là hợp lệ
    const alreadyExists = await this.cinemaRepository.existsByNameAndCity(
      name,
      city,
    );

    if (alreadyExists) {
      throw new AppError(
        `Rạp "${name}" đã tồn tại tại thành phố "${city}"`,
        409,
      );
    }

    // ── Bước 2: Tạo Cinema entity ─────────────────────────────────────
    // Validation nghiệp vụ nằm trong constructor của Entity
    let cinema;
    try {
      cinema = Cinema.create({ name, address, city, phone, imageUrl });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 3: Lưu vào DB ────────────────────────────────────────────
    const savedCinema = await this.cinemaRepository.save(cinema);

    // ── Bước 4: Trả về JSON ───────────────────────────────────────────
    return savedCinema.toJSON();
  }
}

export default CreateCinemaHandler;
