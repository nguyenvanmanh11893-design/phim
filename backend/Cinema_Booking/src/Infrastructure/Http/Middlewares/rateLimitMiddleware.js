import rateLimit from "express-rate-limit";

// Giới hạn chung cho toàn bộ API (ví dụ: 100 request / 15 phút)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: {
    success: false,
    message: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true, // Trả về thông tin giới hạn trong header RateLimit-*
  legacyHeaders: false,
});

// Giới hạn khắt khe cho Auth (ví dụ: 5 lần thử login sai / 1 giờ)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 giờ
  max: 10, // Tối đa 10 lần đăng ký/đăng nhập
  message: {
    success: false,
    message:
      "Quá nhiều lần thử đăng nhập/đăng ký. Vui lòng quay lại sau 1 giờ.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
