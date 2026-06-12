import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =========================
// CREATE PAYMENT SESSION
// =========================
router.post("/stripe/create", paymentController.createStripePayment);

// =========================
// STRIPE WEBHOOK
// ⚠️ phải dùng express.raw()
// =========================

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook,
);
// =========================
// MOMO
// =========================
router.post("/momo/create", paymentController.createMomoPayment);
router.post("/momo/webhook", paymentController.momoWebhook);

export default router;
