import CreateComboCommand from "../../../Application/Combo/Command/CreateComboCommand.js";
import UpdateComboCommand from "../../../Application/Combo/Command/UpdateComboCommand.js";
import DeleteComboCommand from "../../../Application/Combo/Command/DeleteComboCommand.js";
import GetComboQuery from "../../../Application/Combo/Query/GetComboQuery.js";
import ListCombosQuery from "../../../Application/Combo/Query/ListCombosQuery.js";

class ComboController {
  constructor(
    createComboHandler,
    updateComboHandler,
    deleteComboHandler,
    getComboHandler,
    listCombosHandler,
  ) {
    this.createComboHandler = createComboHandler;
    this.updateComboHandler = updateComboHandler;
    this.deleteComboHandler = deleteComboHandler;
    this.getComboHandler = getComboHandler;
    this.listCombosHandler = listCombosHandler;
  }

  async list(req, res, next) {
    try {
      const query = new ListCombosQuery({
        page: req.query.page,
        limit: req.query.limit,
        isActive: req.query.isActive,
      });
      const result = await this.listCombosHandler.execute(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const query = new GetComboQuery({ id: Number(req.params.id) });
      const result = await this.getComboHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const command = new CreateComboCommand(req.body);
      const result = await this.createComboHandler.execute(command);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const command = new UpdateComboCommand({
        ...req.body,
        id: Number(req.params.id),
      });
      const result = await this.updateComboHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const command = new DeleteComboCommand({ id: Number(req.params.id) });
      const result = await this.deleteComboHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default ComboController;
