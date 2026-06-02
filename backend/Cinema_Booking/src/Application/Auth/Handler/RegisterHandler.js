import Email from "../../../Domain/User/ValueObject/Email.js";
import User from "../../../Domain/User/Entity/User.js";
import AppError from "../../../Domain/Errors/AppError.js";
import bcrypt from "bcrypt";

class RegisterHandler {
  // Inject repository qua constructor — không new thẳng trong đây
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(command) {
    // ── Bước 1: Validate đầu vào cơ bản ──────────────────────────────
    const { name, email, password } = command;

    if (!name || name.trim().length < 2) {
      throw new AppError("Tên phải có ít nhất 2 ký tự", 422);
    }

    if (!password || password.length < 6) {
      throw new AppError("Mật khẩu phải có ít nhất 6 ký tự", 422);
    }

    // ── Bước 2: Validate email bằng ValueObject ───────────────────────
    // Email VO tự throw nếu sai định dạng — không cần if/else ở đây
    // "  HELLO@GMAIL.COM  " → tự trim + lowercase bên trong VO
    let emailVO;
    try {
      emailVO = new Email(email);
    } catch (e) {
      throw new AppError(e.message, 422);
    }

    // ── Bước 3: Kiểm tra email đã tồn tại chưa ───────────────────────
    const alreadyTaken = await this.userRepository.existsByEmail(emailVO.value);
    if (alreadyTaken) {
      throw new AppError("Email này đã được sử dụng", 409);
    }

    // ── Bước 4: Hash password ─────────────────────────────────────────
    // saltRounds = 10 là chuẩn phổ biến:
    // - Dưới 10: quá nhanh, dễ bị brute force
    // - Trên 12: quá chậm, ảnh hưởng UX khi traffic cao
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Bước 5: Tạo Entity và lưu vào DB ─────────────────────────────
    // User.create() dùng emailVO để không validate lại lần 2
    const user = User.create({
      name: name.trim(),
      email: emailVO, // truyền Email object thẳng vào
      passwordHash,
    });

    // repository.save() trả về entity có id thật (MySQL AUTO_INCREMENT)
    const savedUser = await this.userRepository.save(user);

    // ── Bước 6: Trả về user — KHÔNG có passwordHash ───────────────────
    // toJSON() trong Entity đã loại bỏ passwordHash rồi
    return savedUser.toJSON();
  }
}

export default RegisterHandler;
