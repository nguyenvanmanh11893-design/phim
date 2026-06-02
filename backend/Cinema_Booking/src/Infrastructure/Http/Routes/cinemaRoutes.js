import express from "express";
import {
  cinemaController,
  roomController,
  seatController,
} from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

// ── Cinema routes ──────────────────────────────────────────────────────────
router.get("/", (req, res, next) => cinemaController.list(req, res, next));
router.get("/:id", (req, res, next) => cinemaController.get(req, res, next));

router.post("/", authMiddleware, requireRole("admin"), (req, res, next) =>
  cinemaController.create(req, res, next),
);
router.patch("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  cinemaController.update(req, res, next),
);
router.delete("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  cinemaController.delete(req, res, next),
);

// ── Room routes — nested under cinema ─────────────────────────────────────
router.get("/:cinemaId/rooms", (req, res, next) =>
  roomController.list(req, res, next),
);

router.post(
  "/:cinemaId/rooms",
  authMiddleware,
  requireRole("admin"),
  (req, res, next) => roomController.create(req, res, next),
);

export default router;
