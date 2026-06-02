// src/Domain/Rating/Repository/RatingRepositoryInterface.js
import AppError from "../../Errors/AppError.js";

class RatingRepositoryInterface {
  // Dùng trong CreateRatingHandler — lưu rating mới
  async save(rating) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateRatingHandler — kiểm tra user đã rate phim này chưa
  async findByUserIdAndMovieId(userId, movieId) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong GetMovieRatingsHandler — lấy danh sách reviews theo movieId
  async findByMovieId(movieId, { page, limit }) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong GetMovieHandler — kèm điểm trung bình vào response phim
  // Trả về { average: number, total: number }
  async getStatsByMovieId(movieId) {
    throw new AppError("Not implemented", 500);
  }

  // Dùng trong CreateRatingHandler — kiểm tra nhẹ trước khi validate sâu hơn
  async existsByUserIdAndMovieId(userId, movieId) {
    throw new AppError("Not implemented", 500);
  }
}

export default RatingRepositoryInterface;
