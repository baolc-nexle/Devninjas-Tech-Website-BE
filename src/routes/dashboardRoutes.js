import express from "express";
import { getDashboardStats, getDashboardChart, getCategoryStats } from "../controllers/dashboardController.js";

const router = express.Router();

// Route lấy dữ liệu thống kê tổng quan (các con số)
router.get("/stats", getDashboardStats);

// Route lấy dữ liệu cho biểu đồ (Revenue, Orders, AOV)
router.get("/chart", getDashboardChart);

// Route mới cho biểu đồ tròn danh mục
router.get("/category-stats", getCategoryStats);

export default router;