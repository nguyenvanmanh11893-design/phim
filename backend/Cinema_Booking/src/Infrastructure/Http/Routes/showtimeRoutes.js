// Infrastructure/Http/Routes/showtimeRoutes.js
import express from "express";
import { showtimeController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

// ── Public routes — không cần đăng nhập ───────────────────────────────────
router.get("/", (req, res, next) => showtimeController.list(req, res, next));

router.get("/:id", (req, res, next) => showtimeController.get(req, res, next));

// ── Admin routes — cần đăng nhập + role admin ─────────────────────────────
router.post("/", authMiddleware, requireRole("admin"), (req, res, next) =>
  showtimeController.create(req, res, next),
);

// PATCH thay vì DELETE — huỷ là soft operation, không xoá khỏi DB
// Booking đã tạo vẫn cần tham chiếu tới showtime để hiển thị lịch sử
router.patch(
  "/:id/cancel",
  authMiddleware,
  requireRole("admin"),
  (req, res, next) => showtimeController.cancel(req, res, next),
);

router.patch("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  showtimeController.update(req, res, next),
);

export default router;
