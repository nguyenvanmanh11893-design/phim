import AppError from "../../../Domain/Errors/AppError.js";

class GetSeatMapQuery {
  constructor({ roomId }) {
    if (!roomId || !Number.isInteger(Number(roomId)) || Number(roomId) <= 0) {
      throw new AppError(
        "roomId is required and must be a positive integer",
        400,
      );
    }

    this.roomId = Number(roomId);
  }
}

export default GetSeatMapQuery;
