import '../../core/utils/dio_client.dart';

class UserApiService {
  final _dioClient = DioClient();

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dioClient.dio.get('/users/me');
    return response.data;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await _dioClient.dio.patch('/users/me', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> changePassword(String oldPassword, String newPassword) async {
    final response = await _dioClient.dio.patch('/users/me/password', data: {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
    });
    return response.data;
  }
}