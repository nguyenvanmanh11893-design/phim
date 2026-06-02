// src/Infrastructure/Http/Routes/ratingRoutes.js
import express from "express";
import { ratingController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });
// mergeParams: true — để lấy được :movieId từ parent router (movieRoutes)

// GET /movies/:movieId/ratings — public, không cần đăng nhập
router.get("/", (req, res, next) =>
  ratingController.listByMovie(req, res, next),
);

// POST /movies/:movieId/ratings — cần đăng nhập
router.post("/", authMiddleware, (req, res, next) =>
  ratingController.create(req, res, next),
);

export default router;
