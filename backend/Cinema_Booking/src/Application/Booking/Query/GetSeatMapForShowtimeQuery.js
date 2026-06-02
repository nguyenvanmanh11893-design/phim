// src/Application/Booking/Query/GetSeatMapForShowtimeQuery.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetSeatMapForShowtimeQuery {
  constructor({ showtimeId }) {
    if (
      !showtimeId ||
      !Number.isInteger(Number(showtimeId)) ||
      Number(showtimeId) <= 0
    ) {
      throw new AppError(
        "showtimeId is required and must be a positive integer",
        400,
      );
    }

    this.showtimeId = Number(showtimeId);
  }
}

export default GetSeatMapForShowtimeQuery;
