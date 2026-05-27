import 'package:flutter/material.dart';
import '../../../data/models/movie.dart';  // ĐỔI sang movie
import '../../../data/services/movie_api_service.dart';  // Dùng API service

class MovieProvider extends ChangeNotifier {
  final MovieApiService _service = MovieApiService();  // ĐỔI từ MockMovieService

  List<Movie> _nowPlayingMovies = [];
  List<Movie> _comingSoonMovies = [];
  bool _isLoading = true;
  String? _error;

  List<Movie> get nowPlayingMovies => _nowPlayingMovies;
  List<Movie> get comingSoonMovies => _comingSoonMovies;
  bool get isLoading => _isLoading;
  String? get error => _error;

  MovieProvider() {
    fetchMovies();
  }

  Future<void> fetchMovies() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Gọi API thật
      final results = await Future.wait([
        _service.getNowShowingMovies(),
        _service.getComingSoonMovies(),
      ]);

      _nowPlayingMovies = results[0];
      _comingSoonMovies = results[1];

      print('✅ Loaded: ${_nowPlayingMovies.length} now playing, ${_comingSoonMovies.length} coming soon');
    } catch (e) {
      _error = e.toString();
      print('❌ Error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}