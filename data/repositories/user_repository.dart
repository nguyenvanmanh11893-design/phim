import '../models/user_model.dart';
import '../services/user_api_service.dart';

class UserRepository {
  final UserApiService _apiService = UserApiService();

  Future<UserModel> getProfile() async {
    final response = await _apiService.getProfile();
    if (response['success'] == true) {
      // Giả sử server bọc data ở trong response['data']
      // Nếu API trả thẳng data ở response['data']['user'] thì điều chỉnh tùy thực tế
      return UserModel.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Lỗi tải hồ sơ cá nhân');
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final response = await _apiService.updateProfile(data);
    if (response['success'] == true) {
      return UserModel.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Lỗi cập nhật hồ sơ');
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    final response = await _apiService.changePassword(currentPassword, newPassword);
    if (response['success'] == true) {
      return true;
    }
    throw Exception(response['message'] ?? 'Lỗi đổi mật khẩu');
  }
}