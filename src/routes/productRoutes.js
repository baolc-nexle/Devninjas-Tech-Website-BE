import express from "express";
import * as productController from "../controllers/productController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js";
import createUploader from "../middlewares/uploadMiddleware.js";

const router = express.Router();
const uploadProduct = createUploader("products");

// 1. Nhóm Route tĩnh (Static routes): Không có tham số, nên đặt lên đầu
router.get("/", productController.getAllProducts);
router.get("/home-data", productController.getHomePageData);

// 2. Nhóm Route có tham số định danh cụ thể (Specific Parameter routes)
// Đặt các route chi tiết hơn trước để tránh bị bắt nhầm bởi route chung hơn
router.get("/category/:categoryId/filters", productController.getCategoryFilters);
router.get("/category/:categoryId", productController.getProductsByCategory);

// 3. Nhóm Route lấy chi tiết theo ID (General Parameter routes)
// Đặt cuối cùng trong nhóm GET để tránh việc bắt nhầm các route ở trên
router.get("/:id", productController.getProductById);

// 4. Các Route thực hiện hành động (POST, PUT, DELETE)
router.post("/", uploadProduct.single("image"), productController.createProduct);
router.put("/:id", uploadProduct.single("image"), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;