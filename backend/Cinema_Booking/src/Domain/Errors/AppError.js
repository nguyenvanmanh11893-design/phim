// Domain/Errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // phân biệt lỗi nghiệp vụ vs lỗi crash
  }
}

export default AppError;
