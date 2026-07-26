import * as cartController from "../controllers/cartController.js";
import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware.js";
const router = express.Router();

// Xóa toàn bộ cart
router.delete("/clear", authMiddleWare, cartController.clearCart);

// Lấy giỏ hàng của user
router.get("/", authMiddleWare, cartController.getCart);

// Thêm sản phẩm vào cart
router.post("/items", authMiddleWare, cartController.addToCart);

// Cập nhật số lượng sản phẩm trong cart
router.put("/items/:variantId", authMiddleWare, cartController.updateQuantity);

// Xóa 1 sản phẩm khỏi cart
router.delete("/items/:variantId", authMiddleWare, cartController.deleteItem);

// Route mới để đổi variant
router.put('/update-variant', authMiddleWare, cartController.updateCartVariant);



export default router;
