// src/Application/Showtime/Handler/UpdateShowtimeHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class UpdateShowtimeHandler {
  /**
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   * @param {import('../../../Domain/Movie/Repository/MovieRepositoryInterface.js').default} movieRepository
   * @param {import('../../../Domain/Cinema/Repository/RoomRepositoryInterface.js').default} roomRepository
   */
  constructor(showtimeRepository, movieRepository, roomRepository) {
    this.showtimeRepository = showtimeRepository;
    this.movieRepository = movieRepository;
    this.roomRepository = roomRepository;
  }

  async execute(command) {
    const { id, roomId, startTime, basePrice, vipPrice, couplePrice } = command;

    // ── Bước 1: Lấy suất chiếu hiện tại từ DB ─────────────────────────
    const showtime = await this.showtimeRepository.findById(id);
    if (!showtime) {
      throw new AppError(`Showtime với id=${id} không tồn tại`, 404);
    }

    // ── Bước 2: KIỂM TRA NGHIỆP VỤ QUAN TRỌNG NHẤT ────────────────────
    // Nếu đã có người đặt vé (PENDING hoặc CONFIRMED), tuyệt đối KHÔNG cho sửa
    const hasBookings = await this.showtimeRepository.hasBookings(id);
    if (hasBookings) {
      throw new AppError(
        "Không thể cập nhật suất chiếu vì đã có khách hàng đặt vé.",
        409,
      );
    }

    // ── Bước 3: Chuẩn bị dữ liệu merge để tính toán ───────────────────
    const newRoomId = roomId !== undefined ? roomId : showtime.roomId;
    const newStartTime =
      startTime !== undefined ? startTime : showtime.startTime;

    let newEndTime = showtime.endTime;

    // ── Bước 4: Kiểm tra phòng và tính lại EndTime (nếu có đổi giờ/phòng)
    if (roomId !== undefined || startTime !== undefined) {
      // Xác minh phòng chiếu mới (nếu đổi phòng) có tồn tại không
      if (roomId !== undefined && roomId !== showtime.roomId) {
        const roomExists = await this.roomRepository.existsById(newRoomId);
        if (!roomExists) {
          throw new AppError(
            `Phòng chiếu với id=${newRoomId} không tồn tại`,
            404,
          );
        }
      }

      // Tính lại endTime = startTime mới + thời lượng phim + 15p buffer
      const movie = await this.movieRepository.findById(showtime.movieId);
      if (!movie) {
        throw new AppError("Không tìm thấy phim của suất chiếu này", 404);
      }

      const BUFFER_MINUTES = 15;
      const durationMinutes = movie.duration + BUFFER_MINUTES;
      newEndTime = new Date(
        newStartTime.getTime() + durationMinutes * 60 * 1000,
      );

      // Kiểm tra trùng lịch (Conflict)
      const conflicts = await this.showtimeRepository.findConflicting({
        roomId: newRoomId,
        startTime: newStartTime,
        endTime: newEndTime,
        excludeId: id, // Bỏ qua chính suất chiếu đang được update
      });

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        throw new AppError(
          `Phòng đã có suất chiếu từ ${conflict.startTime.toLocaleString("vi-VN")} ` +
            `đến ${conflict.endTime.toLocaleString("vi-VN")}`,
          409,
        );
      }
    }

    // ── Bước 5: Merge thử giá vé để validate nghiệp vụ ────────────────
    const mergedBasePrice =
      basePrice !== undefined ? basePrice : showtime.basePrice;
    const mergedVipPrice =
      vipPrice !== undefined ? vipPrice : showtime.vipPrice;
    const mergedCouplePrice =
      couplePrice !== undefined ? couplePrice : showtime.couplePrice;

    if (mergedVipPrice < mergedBasePrice) {
      throw new AppError("Giá vé VIP phải lớn hơn hoặc bằng giá cơ bản", 400);
    }
    if (mergedCouplePrice < mergedBasePrice) {
      throw new AppError(
        "Giá vé Couple phải lớn hơn hoặc bằng giá cơ bản",
        400,
      );
    }

    // ── Bước 6: Cập nhật Entity ───────────────────────────────────────
    // Dùng hàm updateDetails đã tạo ở tầng Domain Entity
    try {
      showtime.updateDetails({
        roomId: newRoomId,
        startTime: newStartTime,
        endTime: newEndTime,
        basePrice: mergedBasePrice,
        vipPrice: mergedVipPrice,
        couplePrice: mergedCouplePrice,
      });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 7: Lưu xuống DB ──────────────────────────────────────────
    // Dùng hàm updateDetails đã tạo ở tầng Repository (Infrastructure)
    const updatedShowtime =
      await this.showtimeRepository.updateDetails(showtime);

    return {
      message: "Cập nhật suất chiếu thành công",
      showtime: updatedShowtime.toJSON(),
    };
  }
}

export default UpdateShowtimeHandler;
