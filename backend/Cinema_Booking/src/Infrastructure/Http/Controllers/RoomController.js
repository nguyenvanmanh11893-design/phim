import CreateRoomCommand from "../../../Application/Cinema/Command/CreateRoomCommand.js";
import UpdateRoomCommand from "../../../Application/Cinema/Command/UpdateRoomCommand.js";
import DeleteRoomCommand from "../../../Application/Cinema/Command/DeleteRoomCommand.js";
import GetRoomQuery from "../../../Application/Cinema/Query/GetRoomQuery.js";
import ListRoomsQuery from "../../../Application/Cinema/Query/ListRoomsQuery.js";

class RoomController {
  constructor(
    createRoomHandler,
    updateRoomHandler,
    deleteRoomHandler,
    getRoomHandler,
    listRoomsHandler,
  ) {
    this.createRoomHandler = createRoomHandler;
    this.updateRoomHandler = updateRoomHandler;
    this.deleteRoomHandler = deleteRoomHandler;
    this.getRoomHandler = getRoomHandler;
    this.listRoomsHandler = listRoomsHandler;
  }

  // GET /cinemas/:cinemaId/rooms
  async list(req, res, next) {
    try {
      const query = new ListRoomsQuery({
        cinemaId: Number(req.params.cinemaId),
      });
      const result = await this.listRoomsHandler.execute(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /rooms/:id
  async get(req, res, next) {
    try {
      const query = new GetRoomQuery({ id: Number(req.params.id) });
      const result = await this.getRoomHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /cinemas/:cinemaId/rooms
  async create(req, res, next) {
    try {
      const command = new CreateRoomCommand({
        ...req.body,
        cinemaId: Number(req.params.cinemaId),
      });
      const result = await this.createRoomHandler.execute(command);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /rooms/:id
  async update(req, res, next) {
    try {
      const command = new UpdateRoomCommand({
        ...req.body,
        id: Number(req.params.id),
      });
      const result = await this.updateRoomHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /rooms/:id
  async delete(req, res, next) {
    try {
      const command = new DeleteRoomCommand({ id: Number(req.params.id) });
      const result = await this.deleteRoomHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default RoomController;
