import express from "express";
import * as flashSaleController from "../controllers/flashSaleController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Lấy danh sách tất cả các chiến dịch
router.get("/", flashSaleController.getAllFlashSales);

// Tạo một chiến dịch mới
router.post("/", flashSaleController.createFlashSale);

router.get("/byDate", flashSaleController.getFlashSalesByDate);

export default router;