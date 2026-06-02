import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/utils/snackbar_utils.dart';
import '../../../core/widgets/custom_app_bar.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/auth_text_field.dart';
import '../../../core/widgets/social_login_buttons.dart';
import '../../../routes/app_routes.dart';
import '../providers/auth_provider.dart';
import 'register_username_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleContinue() async {
    // 1. Kiểm tra Lỗi tĩnh
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.register(
      _emailController.text.trim(),
      _usernameController.text.trim(),
      _passwordController.text,
    );

    if (success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RegisterUsernameScreen(username: _usernameController.text.trim()),
        ),
      );
    } else {
      // 2. Bắt lỗi động
      if (mounted && authProvider.errorMessage != null) {
        SnackbarUtils.showError(context, authProvider.errorMessage!);
        authProvider.clearError();
      }
    }
  }

  Future<void> _handleFacebook() async {
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.loginWithFacebook();
    if (success && mounted) Navigator.pushReplacementNamed(context, AppRoutes.main);
  }

  Future<void> _handleGoogle() async {
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.loginWithGoogle();
    if (success && mounted) Navigator.pushReplacementNamed(context, AppRoutes.main);
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: const CustomAppBar(title: AppStrings.signUp, actions: []),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 20),
                  AuthTextField(
                    hint: AppStrings.email,
                    prefixIcon: Icons.email,
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) => value == null || value.isEmpty ? AppStrings.pleaseEnterEmail : null,
                  ),
                  const SizedBox(height: 16),
                  AuthTextField(
                    hint: AppStrings.username,
                    prefixIcon: Icons.person,
                    controller: _usernameController,
                    validator: (value) => value == null || value.isEmpty ? AppStrings.pleaseEnterUsername : null,
                  ),
                  const SizedBox(height: 16),
                  AuthTextField(
                    hint: AppStrings.password,
                    prefixIcon: Icons.lock_outline,
                    controller: _passwordController,
                    obscureText: true,
                    validator: (value) => value == null || value.isEmpty ? AppStrings.pleaseEnterPassword : null,
                  ),
                  const SizedBox(height: 16),
                  AuthTextField(
                    hint: AppStrings.confirmPassword,
                    prefixIcon: Icons.lock_outline,
                    controller: _confirmController,
                    obscureText: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) return AppStrings.pleaseConfirmPassword;
                      if (value != _passwordController.text) return AppStrings.passwordNotMatch;
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _handleContinue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text(AppStrings.continueBtn, style: AppTextStyles.button),
                  ),
                  const SizedBox(height: 24),
                  SocialLoginButtons(
                    onFacebook: _handleFacebook,
                    onGoogle: _handleGoogle,
                  ),
                  const SizedBox(height: 24),
                  TextButton(
                    onPressed: () {
                      Navigator.pushReplacementNamed(context, AppRoutes.login);
                    },
                    child: Text(
                      AppStrings.alreadyHaveAccount,
                      style: AppTextStyles.bodyLarge.copyWith(color: AppColors.secondary),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    AppStrings.termsAndPrivacy,
                    style: AppTextStyles.bodyMedium.copyWith(fontSize: 10),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          if (authProvider.isLoading) const LoadingIndicator(),
        ],
      ),
    );
  }
}