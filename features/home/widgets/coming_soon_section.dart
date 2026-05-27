import 'package:flutter/material.dart';
import '../../../core/widgets/movie_card.dart';
import '../../../data/models/movie.dart';

class ComingSoonSection extends StatelessWidget {
  final List<Movie> movies;
  const ComingSoonSection({super.key, required this.movies});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 250,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: movies.length,
        itemBuilder: (context, index) {
          return MovieCard(movie: movies[index], isNowPlaying: false);
        },
      ),
    );
  }
}