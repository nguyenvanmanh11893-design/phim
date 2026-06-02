class ListCinemasHandler {
  constructor(cinemaRepository) {
    this.cinemaRepository = cinemaRepository;
  }

  async execute(query) {
    const { page, limit, city } = query;

    const result = await this.cinemaRepository.findAll({ page, limit, city });

    return {
      data: result.data.map((cinema) => cinema.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

export default ListCinemasHandler;
