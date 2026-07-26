import express from "express";
import * as flashSaleItemController from "../controllers/flashSaleItemController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Lấy danh sách sản phẩm thuộc một chiến dịch (ví dụ: /api/flashsale-items/campaign-id-123)
router.get("/:flashSaleId", flashSaleItemController.getFlashSaleItems);

// Thêm sản phẩm vào chiến dịch
router.post("/", flashSaleItemController.addProductToFlashSale);

// Mua hàng (Trigger nghiệp vụ Flash Sale)
router.post("/purchase/:itemId",  flashSaleItemController.purchaseItem);

export default router;