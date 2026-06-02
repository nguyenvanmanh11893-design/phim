// Application/Movie/Handler/ListMoviesHandler.js

class ListMoviesHandler {
  constructor(movieRepository) {
    this.movieRepository = movieRepository;
  }

  async execute(query) {
    const { page, limit, genre, status } = query;

    const result = await this.movieRepository.findAll({
      page,
      limit,
      genre,
      status,
    });

    return {
      data: result.data.map((movie) => movie.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

export default ListMoviesHandler;
