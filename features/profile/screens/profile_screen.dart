import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              // User Info
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.surface,
                    // Use a placeholder icon, can be replaced with NetworkImage or AssetImage
                    child: Icon(Icons.person, size: 40, color: AppColors.textSecondary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Angelina',
                              style: AppTextStyles.headlineMedium,
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined, color: Colors.white),
                              onPressed: () {},
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.phone_outlined, color: AppColors.textSecondary, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              '(704) 555-0127',
                              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.email_outlined, color: AppColors.textSecondary, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'angelina@example.com',
                              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
              // Menu Items
              _buildMenuItem(Icons.confirmation_num_outlined, 'Vé của tôi', () {}),
              _buildMenuItem(Icons.shopping_cart_outlined, 'Lịch sử thanh toán', () {}),
              _buildMenuItem(Icons.language_outlined, 'Đổi ngôn ngữ', () {}),
              _buildMenuItem(Icons.lock_outline, 'Đổi mật khẩu', () {}),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return Column(
      children: [
        ListTile(
          leading: Icon(icon, color: Colors.white, size: 26),
          title: Text(title, style: AppTextStyles.bodyLarge),
          trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          contentPadding: const EdgeInsets.symmetric(vertical: 4),
          onTap: onTap,
        ),
        Divider(color: Colors.grey.withOpacity(0.2), height: 1),
      ],
    );
  }
}
