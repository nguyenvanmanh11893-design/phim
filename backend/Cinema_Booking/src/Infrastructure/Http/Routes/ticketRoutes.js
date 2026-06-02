// src/Infrastructure/Http/Routes/ticketRoutes.js
import express from "express";
import { ticketController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Yêu cầu đăng nhập cho mọi thao tác liên quan đến vé
router.use(authMiddleware);

// API lấy vé để hiển thị trên app
// Trả về JSON chứa qrCode string, Frontend sẽ tự dùng thư viện vẽ hình ảnh QR
router.get("/booking/:bookingId", (req, res, next) =>
  ticketController.getByBooking(req, res, next),
);

export default router;
