class UserRepositoryInterface {
  // --- Tìm kiếm ---

  // Dùng trong LoginHandler — tìm user để verify password
  async findByEmail(email) {
    throw new Error("Not implemented");
  }

  // Dùng trong authMiddleware — sau khi decode JWT lấy userId ra thì fetch user
  async findById(id) {
    throw new Error("Not implemented");
  }

  // --- Kiểm tra tồn tại ---

  // Dùng trong RegisterHandler — kiểm tra email trùng trước khi tạo
  // Tách riêng thay vì dùng findByEmail vì không cần lấy passwordHash ra
  // => truy vấn nhẹ hơn, không expose dữ liệu nhạy cảm không cần thiết
  async existsByEmail(email) {
    throw new Error("Not implemented");
  }

  // --- Ghi dữ liệu ---

  // Dùng trong RegisterHandler — lưu user mới, trả về entity có id thật
  async save(user) {
    throw new Error("Not implemented");
  }

  // Dùng khi user đổi tên, đổi password, được promote lên admin
  async update(user) {
    throw new Error("Not implemented");
  }

  // --- Admin / thống kê (dùng ở Ngày 19+) ---

  // Lấy danh sách user cho trang quản trị, có phân trang
  async findAll({ page, limit, role }) {
    throw new Error("Not implemented");
  }
}

export default UserRepositoryInterface;
