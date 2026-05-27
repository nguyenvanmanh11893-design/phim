import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';
import '../../data/models/movie.dart';

class NewsCard extends StatelessWidget {
  final Movie movie;

  const NewsCard({super.key, required this.movie});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: AppColors.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ảnh phim
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Image.network(
              movie.posterUrl,
              height: 150,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 150,
                color: AppColors.primary,
                child: const Icon(Icons.movie, size: 40, color: AppColors.textSecondary),
              ),
            ),
          ),
          // Nội dung
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tên phim
                Text(
                  movie.title,
                  style: AppTextStyles.titleSmall.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                // Mô tả (description) - THÊM MỚI
                Text(
                  movie.description,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontSize: 12,
                    height: 1.4,
                  ),
                  maxLines: 3,  // Giới hạn 3 dòng
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                // Ngày phát hành
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      movie.formattedReleaseDate,
                      style: AppTextStyles.bodyMedium.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}