import express from "express";
import { paymentController } from "../../Config/container.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

const router = express.Router();
// VNPay uses a signed query, not the customer's JWT.
router.get("/vnpay/ipn", (req, res) => paymentController.vnpayIpn(req, res));
router.get("/vnpay/return", (req, res, next) => paymentController.vnpayReturn(req, res, next));

router.use(authMiddleware);
router.get("/review-required", requireRole("admin"), (req, res, next) =>
  paymentController.reviewRequired(req, res, next));
router.post("/", (req, res, next) => paymentController.initiate(req, res, next));
router.get("/:id", (req, res, next) => paymentController.get(req, res, next));
router.post("/:id/confirm", (req, res, next) => paymentController.confirm(req, res, next));
router.post("/:id/fail", (req, res, next) => paymentController.fail(req, res, next));
export default router;
