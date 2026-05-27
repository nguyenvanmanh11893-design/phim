import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '10:01',
            style: AppTextStyles.bodyLarge.copyWith(fontSize: 14),
          ),
          const SizedBox(height: 8),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(text: 'Chào, Angelina ', style: AppTextStyles.headlineLarge),
                const TextSpan(text: '👑', style: TextStyle(fontSize: 32)),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Chào mừng trở lại',
            style: AppTextStyles.bodyLarge.copyWith(fontSize: 16),
          ),
        ],
      ),
    );
  }
}