// src/Infrastructure/Http/Controllers/RatingController.js
import CreateRatingCommand from "../../../Application/Rating/Command/CreateRatingCommand.js";
import GetMovieRatingsQuery from "../../../Application/Rating/Query/GetMovieRatingsQuery.js";

class RatingController {
  constructor(createRatingHandler, getMovieRatingsHandler) {
    this.createRatingHandler = createRatingHandler;
    this.getMovieRatingsHandler = getMovieRatingsHandler;
  }

  // POST /movies/:movieId/ratings
  async create(req, res, next) {
    try {
      const command = new CreateRatingCommand({
        userId: req.user.userId, // từ JWT, không lấy từ body
        movieId: Number(req.params.movieId),
        score: req.body.score,
        review: req.body.review,
      });

      const result = await this.createRatingHandler.execute(command);

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /movies/:movieId/ratings
  async listByMovie(req, res, next) {
    try {
      const query = new GetMovieRatingsQuery({
        movieId: Number(req.params.movieId),
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      const result = await this.getMovieRatingsHandler.execute(query);

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

export default RatingController;
