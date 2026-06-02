import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../providers/profile_provider.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _currentPwdController = TextEditingController();
  final _newPwdController = TextEditingController();
  final _confirmPwdController = TextEditingController();

  @override
  void dispose() {
    _currentPwdController.dispose();
    _newPwdController.dispose();
    _confirmPwdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfileProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(AppStrings.changePassword, style: AppTextStyles.headlineMedium),
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
            _buildTextField(AppStrings.currentPassword, _currentPwdController),
            const SizedBox(height: 16),
            _buildTextField(AppStrings.newPassword, _newPwdController),
            const SizedBox(height: 16),
            _buildTextField(AppStrings.confirmPassword, _confirmPwdController),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: provider.isLoading ? null : () async {
                  if (_newPwdController.text != _confirmPwdController.text) {
                    SnackbarUtils.showError(context, AppStrings.passwordNotMatch);
                    return;
                  }

                  final success = await provider.changePassword(
                    _currentPwdController.text,
                    _newPwdController.text,
                  );

                  if (success) {
                    if (context.mounted) {
                      SnackbarUtils.showSuccess(context, AppStrings.changePasswordSuccess);
                      Navigator.pop(context);
                    }
                  } else {
                    if (context.mounted && provider.error != null) {
                      SnackbarUtils.showError(context, provider.error!);
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                ),
                child: provider.isLoading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : Text(
                        AppStrings.confirm,
                        style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textButton, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String hintText, TextEditingController controller) {
    return TextFormField(
      controller: controller,
      obscureText: true,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
        prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.background,
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.surface, width: 1)),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.primary, width: 1)),
      ),
    );
  }
}