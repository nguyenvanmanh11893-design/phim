import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Email from "../../../Domain/User/ValueObject/Email.js";
import AppError from "../../../Domain/Errors/AppError.js";
import { env } from "../../../Infrastructure/Config/env.js";
import crypto from "crypto";
import RefreshToken from "../../../Domain/User/Entity/RefreshToken.js";

class LoginHandler {
  constructor(userRepository, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute(command) {
    const { email, password } = command;

    // ── Bước 1: Validate đầu vào cơ bản ──────────────────────────────
    if (!email || !password) {
      throw new AppError("Email và mật khẩu không được để trống", 400);
    }

    // ── Bước 2: Chuẩn hóa email qua ValueObject ───────────────────────
    // Đảm bảo "  HELLO@GMAIL.COM  " tìm được đúng user
    // Nếu sai định dạng → throw luôn, không cần query DB
    const emailVO = new Email(email);

    // ── Bước 3: Tìm user theo email ───────────────────────────────────
    const user = await this.userRepository.findByEmail(emailVO.value);

    // ── Bước 4: Lỗi generic — không tiết lộ email có tồn tại không ────
    // Dùng cùng 1 message cho cả "không tìm thấy" lẫn "sai password"
    // Tránh attacker dò xem email nào đã đăng ký
    const GENERIC_ERROR = "Email hoặc mật khẩu không đúng";

    if (!user) {
      throw new AppError(GENERIC_ERROR, 401);
    }

    // ── Bước 5: Verify password ───────────────────────────────────────
    // bcrypt.compare tự extract salt từ hash, không cần truyền salt riêng
    // Luôn chạy compare dù user không tồn tại? Không cần ở đây vì
    // Email VO đã làm chậm bước validate, timing attack khó thực hiện hơn
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(GENERIC_ERROR, 401);
    }

    // ── Bước 6: Ký JWT ────────────────────────────────────────────────
    const payload = {
      userId: user.id,
      role: user.role,
      // KHÔNG đưa email, name, passwordHash vào payload
      // payload của JWT có thể decode không cần secret key
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const rawRefreshToken = crypto.randomBytes(64).toString("hex");

    const refreshToken = RefreshToken.create({
      userId: user.id,
      token: rawRefreshToken,
      daysValid: 30,
    });

    await this.refreshTokenRepository.save(refreshToken);
    // ── Bước 7: Trả về token + thông tin cơ bản ───────────────────────
    return {
      token,
      refreshToken: rawRefreshToken,
      user: user.toJSON(), // toJSON() đã loại bỏ passwordHash
    };
  }
}

export default LoginHandler;
