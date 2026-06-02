import AppError from "../../../Domain/Errors/AppError.js";

class ListRoomsQuery {
  constructor({ cinemaId }) {
    if (
      !cinemaId ||
      !Number.isInteger(Number(cinemaId)) ||
      Number(cinemaId) <= 0
    ) {
      throw new AppError(
        "cinemaId is required and must be a positive integer",
        400,
      );
    }

    this.cinemaId = Number(cinemaId);
  }
}

export default ListRoomsQuery;
