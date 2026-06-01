import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../core/constants/app_strings.dart'; // Import chuỗi đa ngôn ngữ/hằng số
import '../../../../core/utils/snackbar_utils.dart'; // Import thông báo chung

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController(text: AppStrings.mockUserName);
  final _phoneController = TextEditingController(
    text: AppStrings.mockPhoneNumber,
  );
  final _dobController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          AppStrings.editProfile,
          style: AppTextStyles.headlineMedium,
        ),
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
                  // TODO: Logic mở picker ảnh (Gallery hoặc Camera)
                  // Tạm thời show thông báo mock
                  SnackbarUtils.showSuccess(
                    context,
                    AppStrings.openImagePicker,
                  );
                },
                child: Stack(
                  children: [
                    const CircleAvatar(
                      radius: 50,
                      backgroundColor: AppColors.surface,
                      child: Icon(
                        Icons.person,
                        size: 50,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.secondary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          color: AppColors.textButton,
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            _buildTextField(
              AppStrings.fullName,
              Icons.person_outline,
              _nameController,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              AppStrings.phoneNumber,
              Icons.phone_outlined,
              _phoneController,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              AppStrings.dateOfBirth,
              Icons.calendar_today_outlined,
              _dobController,
              readOnly: true,
              onTap: () async {
                // Mở bảng chọn ngày sinh
                DateTime? pickedDate = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(1900),
                  lastDate: DateTime.now(),
                );
                if (pickedDate != null) {
                  setState(() {
                    _dobController.text =
                        "${pickedDate.day}/${pickedDate.month}/${pickedDate.year}";
                  });
                }
              },
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  // TODO: Gọi API PATCH /users/me (tên, sđt, ngày sinh, avatarUrl)
                  SnackbarUtils.showSuccess(
                    context,
                    AppStrings.updateProfileSuccess,
                  );
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: Text(
                  AppStrings.saveChanges,
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

  Widget _buildTextField(
    String label,
    IconData icon,
    TextEditingController controller, {
    bool readOnly = false,
    VoidCallback? onTap,
  }) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      onTap: onTap,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.textSecondary,
        ),
        prefixIcon: Icon(icon, color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.background,
        enabledBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: AppColors.surface, width: 1),
        ),
        focusedBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
    );
  }
}
