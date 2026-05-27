import 'package:intl/intl.dart';

class Movie {
  final int id;
  final String title;
  final int duration;
  final List<String> genres;
  final List<String> directors;
  final DateTime releaseDate;
  final DateTime endDate;
  final String status;
  final String posterUrl;
  final String description;
  final String ageRating;
  final String language;
  final DateTime createdAt;

  Movie({
    required this.id,
    required this.title,
    required this.duration,
    required this.genres,
    required this.directors,
    required this.releaseDate,
    required this.endDate,
    required this.status,
    required this.posterUrl,
    required this.description,
    required this.ageRating,
    required this.language,
    required this.createdAt,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id'],
      title: json['title'],
      duration: json['duration'],
      genres: List<String>.from(json['genres']),
      directors: List<String>.from(json['directors']),
      releaseDate: DateTime.parse(json['releaseDate']),
      endDate: DateTime.parse(json['endDate']),
      status: json['status'],
      posterUrl: json['posterUrl'],
      description: json['description'] ?? '',
      ageRating: json['ageRating'] ?? '',
      language: json['language'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  // Format duration: 150 phút -> "2h 30m"
  String get formattedDuration {
    final hours = duration ~/ 60;
    final minutes = duration % 60;
    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${minutes}m';
    }
  }

  // Format genres: ["Action", "Adventure"] -> "Action, Adventure"
  String get formattedGenres {
    return genres.join(', ');
  }

  // Format release date: 2026-04-30 -> "30.04.2026"
  String get formattedReleaseDate {
    return DateFormat('dd.MM.yyyy').format(releaseDate);
  }

  // Rating tạm thời (có thể bỏ nếu không dùng)
  double get rating {
    return 4.0 + (id % 10) / 10;
  }

  // Review count tạm thời
  int get reviewCount {
    return 500 + (id * 50);
  }

  // Kiểm tra trạng thái
  bool get isNowShowing => status == 'now_showing';
  bool get isComingSoon => status == 'coming_soon';

  // Lấy tên hero từ title (VD: "Avengers: Doomsday" -> "AVENGERS")
  String get heroName {
    if (title.contains(':')) {
      return title.split(':')[0].trim().toUpperCase();
    }
    if (title.toLowerCase().contains('avengers')) return 'AVENGERS';
    if (title.toLowerCase().contains('john wick')) return 'JOHN WICK';
    if (title.toLowerCase().contains('batman')) return 'BATMAN';
    if (title.toLowerCase().contains('bố già')) return 'BỐ GIÀ';
    return title.split(' ').first.toUpperCase();
  }

  // Lấy chữ cái đầu tiên
  String get bigLetter {
    if (title.contains(':')) {
      return title.split(':')[0][0].toUpperCase();
    }
    return title[0].toUpperCase();
  }
}