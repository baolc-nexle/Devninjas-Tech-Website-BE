import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import createUploader from "../middlewares/uploadMiddleware.js";

const router = express.Router();

const uploadCategory = createUploader("categories");

// 1. Lấy danh mục nổi bật (Featured Categories) - NÊN ĐỂ TRÊN :id ĐỂ TRÁNH BỊ HIỂU NHẦM LÀ ID
router.get("/featured", categoryController.getFeaturedCategories);

// 2. Lấy danh mục theo Slug (SEO)
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// 3. Lấy tất cả category
router.get("/", categoryController.getAllCategory);

// 4. Lấy category theo id
router.get("/:id", categoryController.getCategoryById);

// 5. Tạo mới category
router.post(
  "/",
  uploadCategory.single("image"),
  categoryController.createCategory,
);

// 6. Sửa, update category
router.put(
  "/:id",
  uploadCategory.single("image"),
  categoryController.updateCategory,
);

// 7. Xóa category
router.delete("/:id", categoryController.deleteCategory);

export default router;