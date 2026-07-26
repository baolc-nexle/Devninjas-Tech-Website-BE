import express from "express";
import { createRatingController, getRatingsByProductController } from "../controllers/ratingController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js"; // Middleware xác thực token của bạn

const router = express.Router();

// API lấy danh sách review (Public: Ai cũng xem được)
router.get("/product/:productId", getRatingsByProductController);

// API gửi đánh giá (Private: Bắt buộc phải đăng nhập qua verifyToken)
router.post("/", authMiddleWare, createRatingController);

export default router;