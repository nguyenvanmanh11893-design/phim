class ListAllBookingsHandler {
  constructor(bookingRepository) {
    this.bookingRepository = bookingRepository;
  }

  async execute(query) {
    const { status, userId, page, limit } = query;

    const result = await this.bookingRepository.findAll({
      status,
      userId,
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

export default ListAllBookingsHandler;
