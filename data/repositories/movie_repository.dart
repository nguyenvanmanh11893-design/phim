import '../models/movie.dart';
import '../services/movie_api_service.dart';  // ĐỔI từ mock_api_service

class MovieRepository {
  final MovieApiService _apiService = MovieApiService();  // Dùng API thật

  Future<List<Movie>> getNowPlaying() async {
    return await _apiService.getNowShowingMovies();
  }

  Future<List<Movie>> getComingSoon() async {
    return await _apiService.getComingSoonMovies();
  }

  // Thêm hàm lấy tất cả phim (dùng cho news)
  Future<List<Movie>> getAllMovies() async {
    return await _apiService.getAllMovies();
  }

// XÓA hàm getNews() - không dùng nữa
}