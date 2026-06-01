import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/constants/app_strings.dart'; // Import chuỗi dùng chung
import 'change_language_screen.dart';
import 'change_password_screen.dart';
import 'edit_profile_screen.dart'; 

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
                    child: Icon(
                      Icons.person,
                      size: 40,
                      color: AppColors.textSecondary,
                    ),
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
                              AppStrings.mockUserName,
                              style: AppTextStyles.headlineMedium,
                            ),
                            IconButton(
                              icon: const Icon(
                                Icons.edit_outlined,
                                color: AppColors.textPrimary,
                              ),
                              onPressed: () {
                                // Điều hướng sang màn hình Chỉnh sửa hồ sơ
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const EditProfileScreen(),
                                  ),
                                );
                              },
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(
                              Icons.phone_outlined,
                              color: AppColors.textSecondary,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              AppStrings.mockPhoneNumber,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(
                              Icons.email_outlined,
                              color: AppColors.textSecondary,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              AppStrings.mockEmail,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textSecondary,
                              ),
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
              _buildMenuItem(
                Icons.confirmation_num_outlined,
                AppStrings.myTickets,
                () {},
              ),
              _buildMenuItem(
                Icons.shopping_cart_outlined,
                AppStrings.paymentHistory,
                () {},
              ),
              _buildMenuItem(
                Icons.language_outlined,
                AppStrings.changeLanguage,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ChangeLanguageScreen(),
                    ),
                  );
                },
              ),
              _buildMenuItem(Icons.lock_outline, AppStrings.changePassword, () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const ChangePasswordScreen(),
                  ),
                );
              }),
              const SizedBox(height: 24),
              // Nút Đăng xuất
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    // TODO: Gọi API POST /auth/signOut, xóa local token và quay về màn Login
                  },
                  icon: const Icon(Icons.logout, color: AppColors.error),
                  label: Text(
                    AppStrings.logout,
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppColors.error),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
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
          leading: Icon(icon, color: AppColors.textPrimary, size: 26),
          title: Text(title, style: AppTextStyles.bodyLarge),
          trailing: const Icon(
            Icons.chevron_right,
            color: AppColors.textSecondary,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 4),
          onTap: onTap,
        ),
        Divider(color: Colors.grey.withOpacity(0.2), height: 1),
      ],
    );
  }
}
