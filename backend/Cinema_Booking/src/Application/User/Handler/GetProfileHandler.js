// src/Application/User/Handler/GetProfileHandler.js
import AppError from "../../../Domain/Errors/AppError.js";

class GetProfileHandler {
  /**
   * @param {import('../../../Domain/User/Repository/UserRepositoryInterface.js').default} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(query) {
    const { userId } = query;

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError(`User với id=${userId} không tồn tại`, 404);
    }

    return user.toJSON();
  }
}

export default GetProfileHandler;
