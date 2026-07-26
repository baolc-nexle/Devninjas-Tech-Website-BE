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

router.post(
  "/cod",
  
  paymentController.checkoutCOD
);


export default router;
