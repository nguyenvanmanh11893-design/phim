import CreateCinemaCommand from "../../../Application/Cinema/Command/CreateCinemaCommand.js";
import UpdateCinemaCommand from "../../../Application/Cinema/Command/UpdateCinemaCommand.js";
import DeleteCinemaCommand from "../../../Application/Cinema/Command/DeleteCinemaCommand.js";
import GetCinemaQuery from "../../../Application/Cinema/Query/GetCinemaQuery.js";
import ListCinemasQuery from "../../../Application/Cinema/Query/ListCinemasQuery.js";

class CinemaController {
  constructor(
    createCinemaHandler,
    updateCinemaHandler,
    deleteCinemaHandler,
    getCinemaHandler,
    listCinemasHandler,
  ) {
    this.createCinemaHandler = createCinemaHandler;
    this.updateCinemaHandler = updateCinemaHandler;
    this.deleteCinemaHandler = deleteCinemaHandler;
    this.getCinemaHandler = getCinemaHandler;
    this.listCinemasHandler = listCinemasHandler;
  }

  // GET /cinemas
  async list(req, res, next) {
    try {
      const query = new ListCinemasQuery({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        city: req.query.city,
      });
      const result = await this.listCinemasHandler.execute(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /cinemas/:id
  async get(req, res, next) {
    try {
      const query = new GetCinemaQuery({ id: Number(req.params.id) });
      const result = await this.getCinemaHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /cinemas
  async create(req, res, next) {
    try {
      const command = new CreateCinemaCommand(req.body);
      const result = await this.createCinemaHandler.execute(command);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /cinemas/:id
  async update(req, res, next) {
    try {
      const command = new UpdateCinemaCommand({
        ...req.body,
        id: Number(req.params.id),
      });
      const result = await this.updateCinemaHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /cinemas/:id
  async delete(req, res, next) {
    try {
      const command = new DeleteCinemaCommand({ id: Number(req.params.id) });
      const result = await this.deleteCinemaHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default CinemaController;
