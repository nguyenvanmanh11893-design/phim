import 'package:flutter/material.dart';
import '../../../data/repositories/movie_repository.dart';
import '../../../data/models/movie.dart';

class HomeProvider extends ChangeNotifier {
  final MovieRepository _repository = MovieRepository();

  List<Movie> _nowPlaying = [];
  List<Movie> _comingSoon = [];
  List<Movie> _newsMovies = [];  // ĐỔI TỪ List<NewsItem> thành List<Movie>
  bool _isLoading = true;
  String? _error;

  List<Movie> get nowPlaying => _nowPlaying;
  List<Movie> get comingSoon => _comingSoon;
  List<Movie> get newsMovies => _newsMovies;  // ĐỔI TÊN
  bool get isLoading => _isLoading;
  String? get error => _error;

  HomeProvider() {
    fetchHomeData();
  }

  Future<void> fetchHomeData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Gọi song song 3 API
      final results = await Future.wait([
        _repository.getNowPlaying(),
        _repository.getComingSoon(),
        _repository.getAllMovies(),  // THAY mock news bằng API movies
      ]);

      _nowPlaying = results[0] as List<Movie>;
      _comingSoon = results[1] as List<Movie>;

      // Lấy 5 phim đầu tiên làm news
      final allMovies = results[2] as List<Movie>;
      _newsMovies = allMovies.take(5).toList();

      print('✅ Loaded: ${_nowPlaying.length} now showing, ${_comingSoon.length} coming soon, ${_newsMovies.length} news');
    } catch (e) {
      _error = e.toString();
      print('❌ Error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

// XÓA hàm _getMockNews() - không cần nữa
}