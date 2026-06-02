import AppError from "../../../Domain/Errors/AppError.js";

class UpdateCinemaHandler {
  constructor(cinemaRepository) {
    this.cinemaRepository = cinemaRepository;
  }

  async execute(command) {
    const { id, name, address, city, phone, imageUrl } = command;

    // ── Bước 1: Fetch entity hiện tại từ DB ───────────────────────────
    const existing = await this.cinemaRepository.findById(id);

    if (!existing) {
      throw new AppError(`Cinema với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra trùng tên + city nếu có đổi name hoặc city ──
    // Chỉ check khi client truyền vào ít nhất 1 trong 2 field đó
    // Bỏ qua nếu name+city sau merge vẫn giống hệt record hiện tại
    const incomingName = name !== undefined ? name : existing.name;
    const incomingCity = city !== undefined ? city : existing.city;

    const nameOrCityChanged =
      incomingName !== existing.name || incomingCity !== existing.city;

    if (nameOrCityChanged) {
      const alreadyExists = await this.cinemaRepository.existsByNameAndCity(
        incomingName,
        incomingCity,
      );

      if (alreadyExists) {
        throw new AppError(
          `Rạp "${incomingName}" đã tồn tại tại thành phố "${incomingCity}"`,
          409,
        );
      }
    }

    // ── Bước 3: Merge — chỉ ghi đè field được truyền vào ─────────────
    // undefined → giữ nguyên, null → xóa giá trị (phone, imageUrl)
    existing.name = name !== undefined ? name : existing.name;
    existing.address = address !== undefined ? address : existing.address;
    existing.city = city !== undefined ? city : existing.city;
    existing.phone = phone !== undefined ? phone : existing.phone;
    existing.imageUrl = imageUrl !== undefined ? imageUrl : existing.imageUrl;

    // ── Bước 4: Lưu vào DB ────────────────────────────────────────────
    const updatedCinema = await this.cinemaRepository.update(existing);

    // ── Bước 5: Trả về JSON ───────────────────────────────────────────
    return updatedCinema.toJSON();
  }
}

export default UpdateCinemaHandler;
