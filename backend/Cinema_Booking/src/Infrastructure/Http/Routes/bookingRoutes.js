// src/Infrastructure/Http/Routes/bookingRoutes.js
import express from "express";
import { bookingController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

// ── Seat map — public, không cần đăng nhập ────────────────────────────────
// Đặt ở bookingRoutes thay vì showtimeRoutes vì phụ thuộc bookingRepository
// Nếu muốn đặt ở showtimeRoutes thì cần truyền bookingController sang đó
router.get("/showtimes/:showtimeId/seats", (req, res, next) =>
  bookingController.getSeatMap(req, res, next),
);

// ── Booking routes — tất cả đều cần đăng nhập ────────────────────────────
router.use(authMiddleware);

router.get("/", (req, res, next) => bookingController.list(req, res, next));

router.get("/all", requireRole("admin"), (req, res, next) =>
  bookingController.listAll(req, res, next),
);

router.get("/:id", (req, res, next) => bookingController.get(req, res, next));

router.post("/", (req, res, next) => bookingController.create(req, res, next));

// PATCH thay vì POST — confirm/cancel là thay đổi trạng thái, không tạo resource mới
router.patch("/:id/confirm", (req, res, next) =>
  bookingController.confirm(req, res, next),
);

router.patch("/:id/cancel", (req, res, next) =>
  bookingController.cancel(req, res, next),
);

export default router;
