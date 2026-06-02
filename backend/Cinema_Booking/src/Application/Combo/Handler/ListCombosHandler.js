class ListCombosHandler {
  constructor(comboRepository) {
    this.comboRepository = comboRepository;
  }

  async execute(query) {
    const { page, limit, isActive } = query;

    const result = await this.comboRepository.findAll({
      page,
      limit,
      isActive,
    });

    return {
      data: result.data.map((combo) => combo.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

export default ListCombosHandler;
