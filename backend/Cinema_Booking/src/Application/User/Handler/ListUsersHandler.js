// src/Application/User/Handler/ListUsersHandler.js

class ListUsersHandler {
  /**
   * @param {import('../../../Domain/User/Repository/UserRepositoryInterface.js').default} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(query) {
    const { page, limit, role } = query;

    const result = await this.userRepository.findAll({ page, limit, role });

    return {
      data: result.data.map((user) => user.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

export default ListUsersHandler;
