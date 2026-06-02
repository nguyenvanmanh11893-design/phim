// src/Application/Booking/Handler/ListBookingsHandler.js

class ListBookingsHandler {
  /**
   * @param {import('../../../Domain/Booking/Repository/BookingRepositoryInterface.js').default} bookingRepository
   */
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  async execute(query) {
    const { userId, status, page, limit } = query;

    // ── Lấy danh sách booking của user — có filter status, phân trang ─
    // findByUserId() không fetch seats — tránh N+1
    // Danh sách chỉ cần status, giá, showtimeId để hiển thị card
    // User bấm vào mới gọi GetBookingHandler để lấy chi tiết đầy đủ
    const result = await this.bookingRepository.findByUserId(userId, {
      status,
      page,
      limit,
    });

    return {
      data: result.data.map((booking) => booking.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

export default ListBookingsHandler;
