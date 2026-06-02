import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/constants/app_strings.dart'; // Import chuỗi dùng chung
import '../../../routes/app_routes.dart';
import '../providers/profile_provider.dart'; // Import ProfileProvider
import 'change_language_screen.dart';
import 'change_password_screen.dart';
import 'edit_profile_screen.dart'; 
import '../../../core/utils/snackbar_utils.dart';
import '../../auth/providers/auth_provider.dart'; // Import AuthProvider để gọi hàm logout

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch lại data phòng trường hợp chưa có
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfileProvider>().fetchProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Consumer<ProfileProvider>(
          builder: (context, provider, child) {
            if (provider.isLoading && provider.user == null) {
              return const Center(child: CircularProgressIndicator(color: AppColors.secondary));
            }

            final user = provider.user;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  // User Info
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: AppColors.surface,
                        backgroundImage: user?.avatarUrl != null 
                            ? NetworkImage(user!.avatarUrl!) 
                            : null,
                        child: user?.avatarUrl == null
                            ? const Icon(Icons.person, size: 40, color: AppColors.textSecondary)
                            : null,
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
                                  user?.name ?? 'Tên người dùng',
                                  style: AppTextStyles.headlineMedium,
                                ),
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, color: AppColors.textPrimary),
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (context) => const EditProfileScreen()),
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
                                const Icon(Icons.phone_outlined, color: AppColors.textSecondary, size: 16),
                                const SizedBox(width: 8),
                                Text(
                                  user?.phone ?? 'Chưa cập nhật SĐT',
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
                                  user?.email ?? 'Chưa cập nhật Email',
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
                  _buildMenuItem(Icons.confirmation_num_outlined, AppStrings.myTickets, () {}),
                  _buildMenuItem(Icons.shopping_cart_outlined, AppStrings.paymentHistory, () {}),
                  _buildMenuItem(Icons.language_outlined, AppStrings.changeLanguage, () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const ChangeLanguageScreen()));
                  }),
                  _buildMenuItem(Icons.lock_outline, AppStrings.changePassword, () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const ChangePasswordScreen()));
                  }),
                  const SizedBox(height: 24),
                  // Nút Đăng xuất
                  // Tìm đoạn nút Đăng xuất và sửa lại onPressed:
SizedBox(
  width: double.infinity,
  child: OutlinedButton.icon(
    onPressed: () async {
      // 1. Hiện thông báo đang xử lý (tùy chọn)
      SnackbarUtils.showSuccess(context, 'Đang đăng xuất...');
      
      // 2. Gọi hàm logout từ AuthProvider
      await context.read<AuthProvider>().logout();
      
      // 3. Chuyển hướng về trang Login và xóa sạch lịch sử trang (không cho bấm nút Back)
      if (context.mounted) {
        Navigator.pushNamedAndRemoveUntil(
          context, 
          AppRoutes.login, 
          (route) => false,
        );
      }
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
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  ),
),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
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
          trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          contentPadding: const EdgeInsets.symmetric(vertical: 4),
          onTap: onTap,
        ),
        Divider(color: Colors.grey.withOpacity(0.2), height: 1),
      ],
    );
  }
}