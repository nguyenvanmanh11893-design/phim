import '../models/auth_response_model.dart';
import '../services/auth_api_service.dart';
import '../../core/utils/token_storage.dart';

class AuthRepository {
  final AuthApiService _apiService = AuthApiService();
  final TokenStorage _tokenStorage = TokenStorage();

  Future<AuthResponseModel> loginWithEmail(String email, String password) async {
    final data = await _apiService.loginWithEmail(email, password);
    final authResponse = AuthResponseModel.fromJson(data);
    await _tokenStorage.saveTokens(
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    );
    return authResponse;
  }

  Future<AuthResponseModel> loginWithFacebook() async {
    final data = await _apiService.loginWithFacebook();
    final authResponse = AuthResponseModel.fromJson(data);
    await _tokenStorage.saveTokens(
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    );
    return authResponse;
  }

  Future<AuthResponseModel> loginWithGoogle() async {
    final data = await _apiService.loginWithGoogle();
    final authResponse = AuthResponseModel.fromJson(data);
    await _tokenStorage.saveTokens(
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    );
    return authResponse;
  }

  Future<AuthResponseModel> register(String email, String username, String password) async {
    final data = await _apiService.register(email, username, password);
    final authResponse = AuthResponseModel.fromJson(data);
    await _tokenStorage.saveTokens(
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    );
    return authResponse;
  }
  
  Future<void> logout() async {
    await _tokenStorage.clearTokens();
  }
}
