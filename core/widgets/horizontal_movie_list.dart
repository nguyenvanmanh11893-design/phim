import 'package:flutter/material.dart';
import 'movie_card.dart';
import '../../data/models/movie.dart';

class HorizontalMovieList extends StatelessWidget {
  final List<Movie> movies;
  final bool isNowPlaying;

  const HorizontalMovieList({
    super.key,
    required this.movies,
    this.isNowPlaying = false,
  });

  @override
  Widget build(BuildContext context) {
    if (movies.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: isNowPlaying ? 520 : 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 16),
        itemCount: movies.length,
        itemBuilder: (context, index) {
          return MovieCard(movie: movies[index], isNowPlaying: isNowPlaying);
        },
      ),
    );
  }
}