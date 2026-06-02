class AuthResponseModel {
  final String accessToken;
  final String refreshToken;

  AuthResponseModel({
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? {};
    return AuthResponseModel(
      accessToken: json['token'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
    );
  }
}
// class AuthResponseModel {
//   final String accessToken;
//   final String refreshToken;

//   AuthResponseModel({
//     required this.accessToken,
//     required this.refreshToken,
//   });

//   factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
//     // 1. IN RA ĐỂ DEBUG: Soi xem Backend trả về chính xác cái gì
//     print('=============================================');
//     print('🔥 DỮ LIỆU JSON TỪ BACKEND SAU KHI LOGIN:');
//     print(json);
//     print('=============================================');

//     // 2. Tìm block chứa dữ liệu thật (đề phòng backend không bọc trong 'data')
//     final dynamic dataBlock = json['data'] ?? json;

//     // 3. Bóc tách linh hoạt (Cover cả trường hợp backend ghi là 'token' hoặc 'accessToken')
//     String accToken = '';
//     String refToken = '';

//     if (dataBlock is Map<String, dynamic>) {
//       accToken = dataBlock['token'] ?? dataBlock['accessToken'] ?? '';
//       refToken = dataBlock['refreshToken'] ?? '';
//     }

//     // 4. Báo động đỏ nếu Token vẫn rỗng
//     if (accToken.isEmpty) {
//       print('❌ CẢNH BÁO: App không tìm thấy Access Token trong cục JSON trên!');
//     } else {
//       print('✅ ĐÃ LẤY ĐƯỢC TOKEN THÀNH CÔNG: ${accToken.substring(0, 15)}...');
//     }

//     return AuthResponseModel(
//       accessToken: accToken,
//       refreshToken: refToken,
//     );
//   }
// }