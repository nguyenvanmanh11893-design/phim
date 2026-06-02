// Application/Showtime/Handler/CancelShowtimeHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class CancelShowtimeHandler {
  /**
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   */
  constructor(showtimeRepository) {
    this.showtimeRepository = showtimeRepository;
  }

  async execute(command) {
    const { id } = command;

    // ── Bước 1: Fetch entity — cần status để validate ─────────────────
    // Dùng findById thay vì existsById vì cần gọi showtime.cancel()
    // và trả về thông tin sau khi huỷ
    const showtime = await this.showtimeRepository.findById(id);

    if (!showtime) {
      throw new AppError(`Showtime với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: Gọi domain method — logic huỷ nằm trong Entity ────────
    // showtime.cancel() tự throw nếu status không phải SCHEDULED:
    //   - ONGOING  → đang chiếu, không thể huỷ
    //   - ENDED    → đã kết thúc, không cần huỷ
    //   - CANCELLED → đã huỷ rồi, không huỷ lại
    // Lỗi từ Entity là lỗi nghiệp vụ → wrap thành AppError 422
    try {
      showtime.cancel();
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 3: Persist cancelledAt vào DB ────────────────────────────
    const updatedShowtime = await this.showtimeRepository.update(showtime);

    // ── Bước 4: Trả về kết quả ────────────────────────────────────────
    return {
      message: `Suất chiếu id=${id} đã được huỷ thành công`,
      showtime: updatedShowtime.toJSON(),
    };
  }
}

export default CancelShowtimeHandler;
