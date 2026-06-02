// src/Infrastructure/Http/Routes/userRoutes.js
import express from "express";
import { userController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

// ── Tất cả user routes đều cần đăng nhập ──────────────────────────────────
router.use(authMiddleware);

// ── User tự quản lý profile của mình ──────────────────────────────────────
router.get("/me", (req, res, next) =>
  userController.getProfile(req, res, next),
);

router.patch("/me", (req, res, next) =>
  userController.updateProfile(req, res, next),
);

router.patch("/me/password", (req, res, next) =>
  userController.changePassword(req, res, next),
);

// ── Admin routes ───────────────────────────────────────────────────────────
router.get("/", requireRole("admin"), (req, res, next) =>
  userController.list(req, res, next),
);

router.patch("/:id/role", requireRole("admin"), (req, res, next) =>
  userController.updateRole(req, res, next),
);

export default router;
