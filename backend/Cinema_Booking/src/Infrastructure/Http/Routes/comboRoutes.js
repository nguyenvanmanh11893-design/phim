import express from "express";
import { comboController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

// ── Public routes ────────────────────────────────────────────────────────
router.get("/", (req, res, next) => comboController.list(req, res, next));
router.get("/:id", (req, res, next) => comboController.get(req, res, next));

// ── Admin routes ─────────────────────────────────────────────────────────
router.post("/", authMiddleware, requireRole("admin"), (req, res, next) =>
  comboController.create(req, res, next),
);

router.patch("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  comboController.update(req, res, next),
);

router.delete("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  comboController.delete(req, res, next),
);

export default router;
