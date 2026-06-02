class MovieRepositoryInterface {
  async findById(id) {
    throw new Error("Not implemented");
  }

  async findAll({ page, limit, genre, status }) {
    throw new Error("Not implemented");
  }

  async save(movie) {
    throw new Error("Not implemented");
  }

  async update(movie) {
    throw new Error("Not implemented");
  }

  async delete(id) {
    throw new Error("Not implemented");
  }

  async existsById(id) {
    throw new Error("Not implemented");
  }

  async getHotMovies(limit) {
    throw new Error("Not implemented");
  }
}

export default MovieRepositoryInterface;
