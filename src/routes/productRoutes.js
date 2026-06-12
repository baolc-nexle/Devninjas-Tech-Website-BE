import express from "express";
import * as productController from "../controllers/productController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js";
import createUploader from "../middlewares/uploadMiddleware.js";
const router = express.Router();
const uploadProduct = createUploader("products");
// get all product
router.get("/", productController.getAllProducts);

// lấy sản phẩm theo id
router.get("/:id", productController.getProductById);

// thêm sản phẩm, tạo mới
router.post(
  "/",
  uploadProduct.single("image"),
  productController.createProduct,
);

// sửa sản phẩm, update(cập nhập)
router.put(
  "/:id",
  uploadProduct.single("image"),
  productController.updateProduct,
);

// xóa sản phẩm
router.delete("/:id", productController.deleteProduct);

export default router;
