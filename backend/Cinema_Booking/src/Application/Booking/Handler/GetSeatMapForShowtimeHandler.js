// src/Application/Booking/Handler/GetSeatMapForShowtimeHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetSeatMapForShowtimeHandler {
  /**
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   * @param {import('../../../Domain/Cinema/Repository/RoomRepositoryInterface.js').default}       roomRepository
   * @param {import('../../../Domain/Cinema/Repository/SeatRepositoryInterface.js').default}       seatRepository
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default}   bookingRepository
   */
  constructor(
    showtimeRepository,
    roomRepository,
    seatRepository,
    bookingRepository,
  ) {
    this.showtimeRepository = showtimeRepository;
    this.roomRepository = roomRepository;
    this.seatRepository = seatRepository;
    this.bookingRepository = bookingRepository;
  }

  async execute(query) {
    const { showtimeId } = query;

    // ── Bước 1: Verify showtime tồn tại ───────────────────────────────
    const showtime = await this.showtimeRepository.findById(showtimeId);

    if (!showtime) {
      throw new AppError(`Showtime với id=${showtimeId} không tồn tại`, 404);
    }

    // ── Bước 2: Kiểm tra showtime có thể đặt vé không ─────────────────
    // Không cho xem seat map của suất đã huỷ hoặc đã kết thúc
    // SCHEDULED và ONGOING đều cho xem — ONGOING vẫn có thể có người
    // mua vé muộn tùy nghiệp vụ
    if (showtime.status === "CANCELLED") {
      throw new AppError("Suất chiếu này đã bị huỷ", 422);
    }

    if (showtime.status === "ENDED") {
      throw new AppError("Suất chiếu này đã kết thúc", 422);
    }

    // ── Bước 3: Lấy toàn bộ ghế của phòng ────────────────────────────
    // findByRoomId() trả về ghế đã sắp xếp theo row ASC, number ASC
    // → đúng thứ tự vẽ sơ đồ, không cần sort lại
    const [seats, occupiedSeatIds] = await Promise.all([
      this.seatRepository.findByRoomId(showtime.roomId),
      this.bookingRepository.findOccupiedSeatIdsByShowtimeId(showtimeId),
    ]);

    // ── Bước 4: Tính status + price cho từng ghế ──────────────────────
    // occupiedSeatIds là mảng number — dùng Set để lookup O(1)
    const occupiedSet = new Set(occupiedSeatIds);

    const seatsWithStatus = seats.map((seat) => {
      // Ghế bị deactivate (hỏng) → không thể chọn dù chưa có ai đặt
      if (!seat.isActive) {
        return {
          ...seat.toJSON(),
          status: "UNAVAILABLE",
          price: null,
        };
      }

      const isOccupied = occupiedSet.has(seat.id);

      return {
        ...seat.toJSON(),
        // AVAILABLE  — ghế trống, có thể chọn
        // HELD       — đang được giữ bởi booking PENDING còn hạn
        // BOOKED     — đã được confirm
        //
        // Ở tầng này không phân biệt HELD vs BOOKED vì
        // findOccupiedSeatIdsByShowtimeId() gộp cả 2 lại —
        // client chỉ cần biết "có thể chọn không"
        // Nếu sau này cần phân biệt thì query thêm status từng booking
        status: isOccupied ? "OCCUPIED" : "AVAILABLE",
        price: showtime.priceForSeatType(seat.type),
      };
    });

    // ── Bước 5: Group theo row — giống GetSeatMapHandler ──────────────
    // { A: [{ id, label, type, status, price }, ...], B: [...] }
    const seatMap = seatsWithStatus.reduce((map, seat) => {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat);
      return map;
    }, {});

    // ── Bước 6: Tổng hợp summary ──────────────────────────────────────
    const total = seats.length;
    const unavailable = seatsWithStatus.filter(
      (s) => s.status === "UNAVAILABLE",
    ).length;
    const occupied = seatsWithStatus.filter(
      (s) => s.status === "OCCUPIED",
    ).length;
    const available = seatsWithStatus.filter(
      (s) => s.status === "AVAILABLE",
    ).length;

    return {
      showtime: {
        id: showtime.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        status: showtime.status,
        basePrice: showtime.basePrice,
        vipPrice: showtime.vipPrice,
        couplePrice: showtime.couplePrice,
      },
      seatMap,
      summary: {
        total,
        available,
        occupied,
        unavailable,
        byType: {
          NORMAL: seats.filter((s) => s.type === "NORMAL").length,
          VIP: seats.filter((s) => s.type === "VIP").length,
          COUPLE: seats.filter((s) => s.type === "COUPLE").length,
        },
      },
    };
  }
}

export default GetSeatMapForShowtimeHandler;
