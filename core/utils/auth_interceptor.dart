import 'package:dio/dio.dart';
import 'token_storage.dart';
import '../constants/api_constants.dart';

class AuthInterceptor extends Interceptor {
  final Dio _dio;
  final TokenStorage _tokenStorage;

  AuthInterceptor(this._dio, this._tokenStorage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final accessToken = await _tokenStorage.getAccessToken();
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token might be expired, try refreshing
      bool refreshed = await _refreshToken();
      if (refreshed) {
        // Retry the original request with new token
        try {
          final accessToken = await _tokenStorage.getAccessToken();
          final opts = Options(
            method: err.requestOptions.method,
            headers: err.requestOptions.headers,
          );
          if (accessToken != null && accessToken.isNotEmpty) {
            opts.headers?['Authorization'] = 'Bearer $accessToken';
          }
          
          final cloneReq = await _dio.request(
            err.requestOptions.path,
            options: opts,
            data: err.requestOptions.data,
            queryParameters: err.requestOptions.queryParameters,
          );
          
          return handler.resolve(cloneReq);
        } catch (e) {
          return handler.next(err);
        }
      } else {
        // If refresh fails, clear tokens and pass the error further
        // In a real app, you'd trigger a logout event here
        await _tokenStorage.clearTokens();
        return handler.next(err);
      }
    }
    
    return handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null) return false;

      // Use a separate Dio instance or base client without this interceptor to avoid loops
      final refreshDio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
      final response = await refreshDio.post('/auth/refresh-token', data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200) {
        final newAccessToken = response.data['accessToken'];
        final newRefreshToken = response.data['refreshToken'];

        if (newAccessToken != null && newRefreshToken != null) {
          await _tokenStorage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          );
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
