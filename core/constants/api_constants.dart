class ApiConstants {
  // --- CHỌN 1 TRONG CÁC BASE URL DƯỚI ĐÂY TÙY THEO MÔI TRƯỜNG CHẠY APP ---

  // 1. Cho Android Emulator (Máy ảo Android)
  //static const String baseUrl = 'http://10.0.2.2:5555';

  // 2. Cho iOS Simulator (Máy ảo iOS)
  // static const String baseUrl = 'http://127.0.0.1:5555';

  // 3. Cho thiết bị thật (Cắm cáp/Wi-Fi) - Thay IP bằng IP máy tính của bạn (VD: 192.168.1.X)
  static const String baseUrl = 'http://10.223.65.22:5555';

  static const String movies = '/movies';
}