import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import 'auth_interceptor.dart';
import 'token_storage.dart';

class DioClient {
  late final Dio _dio;

  DioClient() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    final tokenStorage = TokenStorage();

    // Thêm interceptor để xử lý gắn token và refresh token
    _dio.interceptors.add(AuthInterceptor(_dio, tokenStorage));
    
    // Nếu muốn in log để debug, có thể uncomment dòng này
     _dio.interceptors.add(LogInterceptor(requestHeader: true,responseBody: true, requestBody: true));
  }

  Dio get dio => _dio;
}
