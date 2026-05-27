import 'package:dio/dio.dart';
import '../models/movie.dart';
import '../../core/constants/api_constants.dart';

class MovieApiService {
  late final Dio _dio;

  MovieApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
  }

  Future<List<Movie>> getMoviesByStatus(String? status) async {
    try {
      final Map<String, dynamic> queryParams = status != null ? {'status': status} : {};
      final response = await _dio.get(
        ApiConstants.movies,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        // Cách 1: Ép kiểu trực tiếp không cần as
        final responseData = response.data as Map;

        if (responseData['success'] == true) {
          final moviesData = responseData['data'];
          final List<dynamic> movieList = [];

          if (moviesData is List) {
            movieList.addAll(moviesData);
          } else if (moviesData is Map && moviesData.containsKey('data')) {
            movieList.addAll(moviesData['data'] as List);
          }

          return movieList.map((json) {
            // Ép kiểu json sang Map<String, dynamic>
            final Map<String, dynamic> movieMap = {};
            (json as Map).forEach((key, value) {
              movieMap[key.toString()] = value;
            });
            return Movie.fromJson(movieMap);
          }).toList();
        }
      }
      return [];
    } catch (e) {
      print('API Error: $e');
      return [];
    }
  }

  Future<List<Movie>> getNowShowingMovies() async {
    return await getMoviesByStatus('now_showing');
  }

  Future<List<Movie>> getComingSoonMovies() async {
    return await getMoviesByStatus('coming_soon');
  }

  Future<List<Movie>> getAllMovies() async {
    return await getMoviesByStatus(null);
  }
}