import express from "express";
import * as orderController from "../controllers/orderController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js";
import { roleMiddleWare } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/* =======================
   USER ROUTES
======================= */

// Create order from cart
router.post("/", authMiddleWare, orderController.createOrderFromCart);

// Get orders by user
router.get("/my-orders", authMiddleWare, orderController.getOrdersByUser);

// Get order detail
router.get("/:orderId", authMiddleWare, orderController.getOrderById);

// Cancel order
router.patch("/:orderId/cancel", authMiddleWare, orderController.cancelOrder);

/* =======================
   ADMIN ROUTES
======================= */

// Get all orders (admin)
router.get(
  "/admin/all",
  authMiddleWare,
  roleMiddleWare,
  orderController.getAllOrders,
);

// Update order status (admin/system)
router.patch(
  "/admin/:orderId/status",
  authMiddleWare,
  roleMiddleWare,
  orderController.updateOrderStatus,
);

export default router;
