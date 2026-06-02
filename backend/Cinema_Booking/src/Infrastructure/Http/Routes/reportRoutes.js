import express from "express";
import { reportController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();

// Tất cả các route báo cáo đều yêu cầu quyền Admin
router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/overview", (req, res, next) =>
  reportController.getOverview(req, res, next),
);
router.get("/revenue/time", (req, res, next) =>
  reportController.getRevenueByTime(req, res, next),
);
router.get("/revenue/movies", (req, res, next) =>
  reportController.getRevenueByMovie(req, res, next),
);
router.get("/revenue/cinemas", (req, res, next) =>
  reportController.getRevenueByCinema(req, res, next),
);

export default router;
