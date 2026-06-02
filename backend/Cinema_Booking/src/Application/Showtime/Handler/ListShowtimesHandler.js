// Application/Showtime/Handler/ListShowtimesHandler.js

class ListShowtimesHandler {
  /**
   * @param {import('../../../Domain/Showtime/Repository/ShowtimeRepositoryInterface.js').default} showtimeRepository
   */
  constructor(showtimeRepository) {
    this.showtimeRepository = showtimeRepository;
  }

  async execute(query) {
    const { movieId, cinemaId, date, status, page, limit } = query;

    const result = await this.showtimeRepository.findAll({
      movieId,
      cinemaId,
      date,
      status,
      page,
      limit,
    });

    return {
      data: result.data.map((showtime) => showtime.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

export default ListShowtimesHandler;
