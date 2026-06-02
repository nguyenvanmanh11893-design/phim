import AppError from "../../../Domain/Errors/AppError.js";

class GetCinemaHandler {
  constructor(cinemaRepository) {
    this.cinemaRepository = cinemaRepository;
  }

  async execute(query) {
    const { id } = query;

    const cinema = await this.cinemaRepository.findById(id);

    if (!cinema) {
      throw new AppError(`Cinema với id=${id} không tồn tại`, 404);
    }

    return cinema.toJSON();
  }
}

export default GetCinemaHandler;
