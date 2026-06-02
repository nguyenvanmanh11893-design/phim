// Infrastructure/Http/Routes/movieRoutes.js
import express from "express";
import { movieController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";
import ratingRoutes from "./ratingRoutes.js";

const router = express.Router();

// ── Public routes — không cần đăng nhập ───────────────────────────────────
router.get("/", (req, res, next) => movieController.list(req, res, next));

router.get("/hot", (req, res, next) => movieController.listHot(req, res, next));

router.get("/:id", (req, res, next) => movieController.get(req, res, next));

// ── Admin routes — cần đăng nhập + role admin ─────────────────────────────
router.post("/", authMiddleware, requireRole("admin"), (req, res, next) =>
  movieController.create(req, res, next),
);

router.patch("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  movieController.update(req, res, next),
);

router.delete("/:id", authMiddleware, requireRole("admin"), (req, res, next) =>
  movieController.delete(req, res, next),
);

// Nested route — /movies/:movieId/ratings
router.use("/:movieId/ratings", ratingRoutes);

export default router;
