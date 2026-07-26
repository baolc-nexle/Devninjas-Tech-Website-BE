import express from "express";
import * as catAttrController from "../controllers/categoryAttributeController.js";

const router = express.Router();

// Gán thuộc tính vào danh mục (Admin)
// POST: /api/category-attributes/assign
router.post("/assign", catAttrController.assignAttribute);

// Lấy tất cả thuộc tính của một danh mục (Frontend)
// GET: /api/category-attributes/:categoryId
router.get("/:categoryId", catAttrController.getAttributes);

// Xóa thuộc tính khỏi danh mục (Admin)
// DELETE: /api/category-attributes/:categoryId/:attributeId
// router.delete("/:categoryId/:attributeId", catAttrController.removeAttribute);

export default router;