// Infrastructure/Http/Routes/paymentRoutes.js
import express from "express";
import { paymentController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả payment routes đều cần đăng nhập
router.use(authMiddleware);

// POST /payments — khởi tạo payment session
router.post("/", (req, res, next) =>
  paymentController.initiate(req, res, next),
);

// GET /payments/:id — xem trạng thái payment
router.get("/:id", (req, res, next) => paymentController.get(req, res, next));

// POST /payments/:id/confirm — mock: giả lập TT thành công
router.post("/:id/confirm", (req, res, next) =>
  paymentController.confirm(req, res, next),
);

// POST /payments/:id/fail — mock: giả lập user huỷ hoặc TT thất bại
router.post("/:id/fail", (req, res, next) =>
  paymentController.fail(req, res, next),
);

export default router;
