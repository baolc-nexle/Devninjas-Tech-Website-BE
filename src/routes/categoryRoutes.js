import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import upload from "../middlewares/uploadMiddleware.js";
import createUploader from "../middlewares/uploadMiddleware.js";
const router = express.Router();

const uploadCategory = createUploader("categories");
// lấy tất cả category
router.get("/", categoryController.getAllCategory);

// lấy category theo id
router.get("/:id", categoryController.getCategoryById);

// tạo mới category
router.post(
  "/",
  uploadCategory.single("image"),
  categoryController.createCategory,
);

// sửa, update category
router.put(
  "/:id",
  uploadCategory.single("image"),
  categoryController.updateCategory,
);

// xóa category
router.delete("/:id", categoryController.deleteCategory);

export default router;
