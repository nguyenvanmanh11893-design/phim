// src/Application/Rating/Handler/GetMovieRatingsHandler.js

class GetMovieRatingsHandler {
  /**
   * @param {import('../../../Domain/Rating/Repository/RatingRepositoryInterface.js').default} ratingRepository
   * @param {import('../../../Domain/Movie/Repository/MovieRepositoryInterface.js').default}   movieRepository
   */
  constructor(ratingRepository, movieRepository) {
    this.ratingRepository = ratingRepository;
    this.movieRepository = movieRepository;
  }

  async execute(query) {
    const { movieId, page, limit } = query;

    // ── Bước 1: Verify phim tồn tại ──────────────────────────────────
    const movieExists = await this.movieRepository.existsById(movieId);

    if (!movieExists) {
      throw new Error(`Movie với id=${movieId} không tồn tại`);
    }

    // ── Bước 2: Lấy danh sách ratings + stats song song ───────────────
    // Không cần tuần tự — 2 query độc lập nhau
    const [result, stats] = await Promise.all([
      this.ratingRepository.findByMovieId(movieId, { page, limit }),
      this.ratingRepository.getStatsByMovieId(movieId),
    ]);

    return {
      data: result.data.map((rating) => rating.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        averageScore: stats.average,
        totalRatings: stats.total,
      },
    };
  }
}

export default GetMovieRatingsHandler;
