import express from "express";
import * as VoucherController from "../controllers/voucherController.js";
// import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Giả sử bạn có middleware này
import { authMiddleWare } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route cho Admin
router.post("/", VoucherController.createVoucher); 
router.get("/", VoucherController.getAllVouchers);
router.put("/:id", VoucherController.updateVoucher);
router.delete("/:id", VoucherController.deleteVoucher);

// Route cho User
router.post("/validate", authMiddleWare, VoucherController.validateVoucher);
router.post("/apply", authMiddleWare, VoucherController.applyVoucher);
router.post("/remove", authMiddleWare, VoucherController.removeVoucher);

router.get("/available", authMiddleWare, VoucherController.getAvailableVouchers);

export default router;