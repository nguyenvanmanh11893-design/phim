class ListHotMoviesHandler {
  constructor(movieRepository) {
    this.movieRepository = movieRepository;
  }

  async execute(query) {
    const movies = await this.movieRepository.getHotMovies(query.limit);

    return {
      data: movies.map((movie) => movie.toJSON()),
    };
  }
}

export default ListHotMoviesHandler;
