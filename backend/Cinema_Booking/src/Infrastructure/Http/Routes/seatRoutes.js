import express from "express";
import { seatController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

router.patch("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  seatController.update(req, res, next),
);

export default router;
