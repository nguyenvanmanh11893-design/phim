import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class HomeSearchBar extends StatelessWidget {
  const HomeSearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.cardColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const TextField(
          decoration: InputDecoration(
            hintText: '🔍 Tìm kiếm',
            hintStyle: AppTextStyles.bodyLarge,
            border: InputBorder.none,
            contentPadding: EdgeInsets.all(16),
          ),
          style: AppTextStyles.bodyLarge,
        ),
      ),
    );
  }
}