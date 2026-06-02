// Infrastructure/Http/Controllers/MovieController.js
import CreateMovieCommand from "../../../Application/Movie/Command/CreateMovieCommand.js";
import UpdateMovieCommand from "../../../Application/Movie/Command/UpdateMovieCommand.js";
import DeleteMovieCommand from "../../../Application/Movie/Command/DeleteMovieCommand.js";
import GetMovieQuery from "../../../Application/Movie/Query/GetMovieQuery.js";
import ListMoviesQuery from "../../../Application/Movie/Query/ListMoviesQuery.js";
import ListHotMoviesQuery from "../../../Application/Movie/Query/ListHotMoviesQuery.js";

class MovieController {
  constructor(
    createMovieHandler,
    updateMovieHandler,
    deleteMovieHandler,
    getMovieHandler,
    listMoviesHandler,
    listHotMoviesHandler,
  ) {
    this.createMovieHandler = createMovieHandler;
    this.updateMovieHandler = updateMovieHandler;
    this.deleteMovieHandler = deleteMovieHandler;
    this.getMovieHandler = getMovieHandler;
    this.listMoviesHandler = listMoviesHandler;
    this.listHotMoviesHandler = listHotMoviesHandler;
  }

  // GET /movies
  async list(req, res, next) {
    try {
      const query = new ListMoviesQuery({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        genre: req.query.genre,
        status: req.query.status,
      });

      const result = await this.listMoviesHandler.execute(query);

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /movies/:id
  async get(req, res, next) {
    try {
      const query = new GetMovieQuery({ id: Number(req.params.id) });
      const result = await this.getMovieHandler.execute(query);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /movies
  async create(req, res, next) {
    try {
      const command = new CreateMovieCommand(req.body);
      const result = await this.createMovieHandler.execute(command);

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /movies/:id
  async update(req, res, next) {
    try {
      const command = new UpdateMovieCommand({
        ...req.body,
        id: Number(req.params.id),
      });
      const result = await this.updateMovieHandler.execute(command);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /movies/:id
  async delete(req, res, next) {
    try {
      const command = new DeleteMovieCommand({ id: Number(req.params.id) });
      await this.deleteMovieHandler.execute(command);

      res.status(200).json({
        success: true,
        data: { message: `Xóa phim id=${req.params.id} thành công` },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /movies/hot
  async listHot(req, res, next) {
    try {
      const query = new ListHotMoviesQuery();
      const result = await this.listHotMoviesHandler.execute(query);

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

export default MovieController;
