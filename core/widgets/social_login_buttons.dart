import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';

class SocialLoginButtons extends StatelessWidget {
  final VoidCallback onFacebook;
  final VoidCallback onGoogle;

  const SocialLoginButtons({
    super.key,
    required this.onFacebook,
    required this.onGoogle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Row(
          children: [
            Expanded(child: Divider(color: Colors.white38)),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text('Or continue with', style: AppTextStyles.bodyMedium),
            ),
            Expanded(child: Divider(color: Colors.white38)),
          ],
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSocialButton(
              icon: FontAwesomeIcons.facebook,
              label: 'Facebook',
              onTap: onFacebook,
              color: Color(0xFF1877F2),
            ),
            const SizedBox(width: 24),
            _buildSocialButton(
              icon: FontAwesomeIcons.google,
              label: 'Google',
              onTap: onGoogle,
              color: AppColors.textPrimary,
              textColor: AppColors.textButton,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color color,
    Color textColor = Colors.white,
  }) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: textColor),
      label: Text(
        label,
        style: AppTextStyles.button.copyWith(color: textColor),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: textColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      ),
    );
  }
}
