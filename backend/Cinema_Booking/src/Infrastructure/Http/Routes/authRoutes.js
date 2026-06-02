import express, { Router } from "express";
import { authController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import { authLimiter } from "../Middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post("/signUp", authLimiter, (req, res, next) =>
  authController.register(req, res, next),
);

router.post("/signIn", authLimiter, (req, res, next) =>
  authController.login(req, res, next),
);

router.post("/signOut", authMiddleware, (req, res, next) =>
  authController.logout(req, res, next),
);

router.post("/refresh-token", (req, res, next) =>
  authController.refreshToken(req, res, next),
);

export default router;
