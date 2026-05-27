import 'package:flutter/material.dart';
import 'dart:async';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';
import '../../data/models/movie.dart';

class NowPlayingCarousel extends StatefulWidget {
  final List<Movie> movies;

  const NowPlayingCarousel({super.key, required this.movies});

  @override
  State<NowPlayingCarousel> createState() => _NowPlayingCarouselState();
}

class _NowPlayingCarouselState extends State<NowPlayingCarousel> {
  late PageController _pageController;
  int _currentPage = 0;
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.75);
    _startAutoPlay();
  }

  void _startAutoPlay() {
    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (widget.movies.isNotEmpty) {
        final nextPage = (_currentPage + 1) % widget.movies.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.movies.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: [
        SizedBox(
          height: 500,  // Giảm chiều cao vì không còn text trong ảnh
          child: PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.horizontal,
            itemCount: widget.movies.length,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            itemBuilder: (context, index) {
              final movie = widget.movies[index];
              final isActive = index == _currentPage;

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Column(
                  children: [
                    // ẢNH - nằm trên
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      height: isActive ? 400 : 380,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(isActive ? 0.5 : 0.2),
                            blurRadius: isActive ? 15 : 8,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Opacity(
                        opacity: isActive ? 1.0 : 0.6,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Image.network(
                            movie.posterUrl,
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: AppColors.cardColor,
                              child: const Icon(Icons.movie, size: 50, color: Colors.white54),
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // THÔNG TIN - nằm dưới ảnh
                    // THÔNG TIN - nằm dưới ảnh, căn giữa
                    AnimatedOpacity(
                      duration: const Duration(milliseconds: 300),
                      opacity: isActive ? 1.0 : 0.0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,  // ✅ SỬA 1
                          children: [
                            // Tên phim
                            Text(
                              movie.title,
                              style: AppTextStyles.titleMedium.copyWith(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,  // ✅ SỬA 2
                            ),
                            const SizedBox(height: 6),
                            // Thời lượng và thể loại
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,  // Giữ nguyên
                              children: [
                                Text(
                                  movie.formattedDuration,
                                  style: AppTextStyles.bodyMedium.copyWith(fontSize: 12),
                                ),
                                const Text(
                                  ' · ',
                                  style: TextStyle(color: Colors.white54),
                                ),
                                Flexible(  // ĐỔI Expanded thành Flexible
                                  child: Text(
                                    movie.formattedGenres,
                                    style: AppTextStyles.bodyMedium.copyWith(fontSize: 12),
                                    overflow: TextOverflow.ellipsis,
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            // Rating
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,  // ✅ SỬA 5
                              children: [
                                const Icon(
                                  Icons.star,
                                  size: 14,
                                  color: Color(0xFFFFD700),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${movie.rating} (${movie.reviewCount})',
                                  style: const TextStyle(
                                    color: Color(0xFFFFD700),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 16),

        // Indicator dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.movies.length,
                (index) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: _currentPage == index ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: _currentPage == index
                    ? AppColors.secondary
                    : Colors.white38,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }
}