import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../core/constants/app_strings.dart'; // Import chuỗi đa ngôn ngữ/hằng số
import '../../../../core/utils/snackbar_utils.dart'; // Thêm helper Show Snackbar

class ChangePasswordScreen extends StatelessWidget {
  const ChangePasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          AppStrings.changePassword,
          style: AppTextStyles.headlineMedium,
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            _buildTextField(AppStrings.currentPassword),
            const SizedBox(height: 16),
            _buildTextField(AppStrings.newPassword),
            const SizedBox(height: 16),
            _buildTextField(AppStrings.confirmPassword),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  // TODO: Gọi API đổi mật khẩu
                  SnackbarUtils.showSuccess(
                    context,
                    AppStrings.changePasswordSuccess,
                  );
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary, // Màu vàng
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: Text(
                  AppStrings.confirm,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.textButton,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String hintText) {
    return TextFormField(
      obscureText: true,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.textSecondary,
        ),
        prefixIcon: const Icon(
          Icons.lock_outline,
          color: AppColors.textSecondary,
        ),
        filled: true,
        fillColor: AppColors.background,
        enabledBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: AppColors.surface, width: 1),
        ),
        focusedBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: AppColors.primary, width: 1),
        ),
      ),
    );
  }
}
