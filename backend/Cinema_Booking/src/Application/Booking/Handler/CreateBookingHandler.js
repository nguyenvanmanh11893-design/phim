// src/Application/Booking/Handler/CreateBookingHandler.js
import AppError from "../../../Domain/Errors/AppError.js";
import Booking from "../../../Domain/Booking/Entity/Booking.js";
import BookingSeat from "../../../Domain/Booking/Entity/BookingSeat.js";
import BookingCombo from "../../../Domain/Booking/Entity/BookingCombo.js";

class CreateBookingHandler {
  /**
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default}  showtimeRepository
   * @param {import('../../../Domain/Cinema/Repository/SeatRepositoryInterface.js').default}        seatRepository
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default}    bookingRepository
   * @param {import('../../../Domain/Combo/Repository/ComboRepositoryInterface.js').default}      comboRepository
   */
  constructor(
    showtimeRepository,
    seatRepository,
    bookingRepository,
    comboRepository,
  ) {
    this.showtimeRepository = showtimeRepository;
    this.seatRepository = seatRepository;
    this.bookingRepository = bookingRepository;
    this.comboRepository = comboRepository;
  }

  async execute(command) {
    const { userId, showtimeId, seatIds, comboItems } = command;

    // ── Bước 1: Verify showtime tồn tại và còn đặt được ──────────────
    const showtime = await this.showtimeRepository.findById(showtimeId);

    if (!showtime) {
      throw new AppError(`Showtime với id=${showtimeId} không tồn tại`, 404);
    }

    // isBookable() = status === "SCHEDULED"
    // ONGOING, ENDED, CANCELLED đều không cho đặt
    if (!showtime.isBookable()) {
      throw new AppError(
        `Suất chiếu này không thể đặt vé (trạng thái: ${showtime.status})`,
        422,
      );
    }

    // ── Bước 2: Verify từng ghế — tồn tại + thuộc đúng phòng ─────────
    // Dùng findByIdAndRoomId() để tránh client truyền seatId của phòng khác
    // Query song song thay vì tuần tự — N ghế = N queries chạy cùng lúc
    const seatResults = await Promise.all(
      seatIds.map((seatId) =>
        this.seatRepository.findByIdAndRoomId(seatId, showtime.roomId),
      ),
    );

    // Ghế nào trả về null là không tồn tại hoặc không thuộc phòng này
    const invalidSeat = seatResults.findIndex((s) => s === null);
    if (invalidSeat !== -1) {
      throw new AppError(
        `Ghế id=${seatIds[invalidSeat]} không tồn tại trong phòng chiếu này`,
        422,
      );
    }

    const seats = seatResults; // tất cả đều hợp lệ

    // ── Bước 3: Kiểm tra ghế còn active không ────────────────────────
    // Ghế bị deactivate (hỏng) không cho đặt dù chưa có booking
    const inactiveSeat = seats.find((s) => !s.isActive);
    if (inactiveSeat) {
      throw new AppError(`Ghế ${inactiveSeat.label} hiện không khả dụng`, 422);
    }

    // ── Bước 4: Kiểm tra ghế còn trống không ─────────────────────────
    // findOccupiedSeatIdsByShowtimeId() trả về seatId đang bị giữ bởi
    // CONFIRMED hoặc PENDING còn hạn — PENDING hết hạn tự bị bỏ qua
    const occupiedSeatIds =
      await this.bookingRepository.findOccupiedSeatIdsByShowtimeId(showtimeId);

    const occupiedSet = new Set(occupiedSeatIds);
    const conflictSeat = seats.find((s) => occupiedSet.has(s.id));

    if (conflictSeat) {
      throw new AppError(
        `Ghế ${conflictSeat.label} đã được đặt hoặc đang được giữ`,
        409,
      );
    }

    // ── Bước 5: Tính giá từng ghế + tổng tiền ────────────────────────
    // priceForSeatType() đã có sẵn trong Showtime entity
    // Tính price tại đây để snapshot vào booking_seats —
    // tránh bị ảnh hưởng nếu admin đổi giá showtime sau này
    const bookingSeats = seats.map((seat) =>
      BookingSeat.create({
        seatId: seat.id,
        seatLabel: seat.label, // "A1", "B12"
        seatType: seat.type, // "NORMAL" | "VIP" | "COUPLE"
        price: showtime.priceForSeatType(seat.type),
      }),
    );

    let totalPrice = bookingSeats.reduce((sum, s) => sum + s.price, 0);

    // ── Bước 5.5: Xử lý Combo (Mới) ──
    const bookingCombos = [];
    if (comboItems.length > 0) {
      const comboIds = comboItems.map((i) => i.comboId);
      const foundCombos = await this.comboRepository.findByIds(comboIds);

      if (foundCombos.length !== new Set(comboIds).size) {
        throw new AppError("Một số combo không tồn tại", 422);
      }

      if (foundCombos.some((c) => !c.isActive)) {
        throw new AppError("Có combo hiện đang ngừng kinh doanh", 422);
      }

      comboItems.forEach((item) => {
        const combo = foundCombos.find((c) => c.id === item.comboId);
        const bCombo = BookingCombo.create({
          comboId: combo.id,
          comboName: combo.name,
          quantity: item.quantity,
          price: combo.price,
        });
        bookingCombos.push(bCombo);
        totalPrice += bCombo.price * bCombo.quantity;
      });
    }

    // ── Bước 6: Tạo Booking entity ────────────────────────────────────
    // Booking.create() tự tính heldUntil = now + 10 phút
    let booking;
    try {
      booking = Booking.create({
        userId,
        showtimeId,
        seats: bookingSeats,
        combos: bookingCombos,
        totalPrice,
      });
    } catch (err) {
      throw new AppError(err.message, 422);
    }

    // ── Bước 7: Lưu vào DB ────────────────────────────────────────────
    // save() tự handle transaction: insert bookings + booking_seats
    // Nếu có race condition (2 user chọn cùng ghế cùng lúc),
    // UNIQUE KEY (booking_id, seat_id) trong booking_seats sẽ throw —
    // nhưng cần thêm SELECT ... FOR UPDATE nếu muốn chắc chắn hơn
    const savedBooking = await this.bookingRepository.save(booking);

    // ── Bước 8: Trả về kết quả ────────────────────────────────────────
    return {
      ...savedBooking.toJSON(),
      // Nhắc user biết còn bao nhiêu thời gian để thanh toán
      message: `Đặt ghế thành công. Vui lòng thanh toán trong vòng 10 phút.`,
    };
  }
}

export default CreateBookingHandler;
