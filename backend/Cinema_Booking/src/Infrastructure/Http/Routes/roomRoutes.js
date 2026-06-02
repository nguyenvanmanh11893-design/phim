import express from "express";
import { roomController, seatController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/:id", (req, res, next) => roomController.get(req, res, next));
router.patch("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  roomController.update(req, res, next),
);
router.delete("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  roomController.delete(req, res, next),
);

// ── Seat map — nested under room ───────────────────────────────────────────
router.get("/:roomId/seats", (req, res, next) =>
  seatController.getSeatMap(req, res, next),
);

export default router;
