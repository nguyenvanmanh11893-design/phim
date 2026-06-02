import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../core/constants/app_strings.dart'; 
import '../../../../core/utils/snackbar_utils.dart';
import '../providers/profile_provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Điền trước thông tin hiện tại
    final user = context.read<ProfileProvider>().user;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone ?? '';
      _dobController.text = user.dateOfBirth ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfileProvider>();
    final user = provider.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(AppStrings.editProfile, style: AppTextStyles.headlineMedium),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Center(
              child: GestureDetector(
                onTap: () {
                  // TODO: Gọi Image Picker -> API POST /upload/image -> lấy URL lưu vào biến
                  SnackbarUtils.showSuccess(context, AppStrings.openImagePicker);
                },
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: AppColors.surface,
                      backgroundImage: user?.avatarUrl != null ? NetworkImage(user!.avatarUrl!) : null,
                      child: user?.avatarUrl == null 
                          ? const Icon(Icons.person, size: 50, color: AppColors.textSecondary)
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(color: AppColors.secondary, shape: BoxShape.circle),
                        child: const Icon(Icons.camera_alt, color: AppColors.textButton, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            _buildTextField(AppStrings.fullName, Icons.person_outline, _nameController),
            const SizedBox(height: 16),
            _buildTextField(AppStrings.phoneNumber, Icons.phone_outlined, _phoneController),
            const SizedBox(height: 16),
            _buildTextField(
              AppStrings.dateOfBirth,
              Icons.calendar_today_outlined,
              _dobController,
              readOnly: true,
              onTap: () async {
                DateTime? pickedDate = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(1900),
                  lastDate: DateTime.now(),
                );
                if (pickedDate != null) {
                  setState(() {
                    _dobController.text = "${pickedDate.day}/${pickedDate.month}/${pickedDate.year}";
                  });
                }
              },
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: provider.isLoading ? null : () async {
                  final success = await provider.updateProfile(
                    name: _nameController.text.trim(),
                    phone: _phoneController.text.trim(),
                    dob: _dobController.text.trim(),
                  );
                  if (success) {
                    if (context.mounted) {
                      SnackbarUtils.showSuccess(context, AppStrings.updateProfileSuccess);
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
                        AppStrings.saveChanges,
                        style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textButton, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, IconData icon, TextEditingController controller, {bool readOnly = false, VoidCallback? onTap}) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      onTap: onTap,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
        prefixIcon: Icon(icon, color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.background,
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.surface, width: 1)),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.secondary, width: 1)),
      ),
    );
  }
}