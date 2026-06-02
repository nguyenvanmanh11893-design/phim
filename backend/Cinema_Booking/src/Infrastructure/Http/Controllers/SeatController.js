import UpdateSeatCommand from "../../../Application/Cinema/Command/UpdateSeatCommand.js";
import GetSeatMapQuery from "../../../Application/Cinema/Query/GetSeatMapQuery.js";

class SeatController {
  constructor(updateSeatHandler, getSeatMapHandler) {
    this.updateSeatHandler = updateSeatHandler;
    this.getSeatMapHandler = getSeatMapHandler;
  }

  // GET /rooms/:roomId/seats
  async getSeatMap(req, res, next) {
    try {
      const query = new GetSeatMapQuery({ roomId: Number(req.params.roomId) });
      const result = await this.getSeatMapHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /seats/:id
  async update(req, res, next) {
    try {
      const command = new UpdateSeatCommand({
        ...req.body,
        id: Number(req.params.id),
      });
      const result = await this.updateSeatHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default SeatController;
