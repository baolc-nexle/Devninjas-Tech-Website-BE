import express from "express";
import { 
  getAddressesController, 
  createAddressController, 
  updateAddressController, 
  deleteAddressController 
} from "../controllers/addressController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js"; // Đổi đường dẫn middleware tùy theo project của bạn

const router = express.Router();

// Tất cả các route quản lý địa chỉ đều yêu cầu người dùng phải đăng nhập
router.get("/", authMiddleWare, getAddressesController);         // Lấy danh sách địa chỉ
router.post("/", authMiddleWare, createAddressController);        // Thêm địa chỉ mới
router.put("/:addressId", authMiddleWare, updateAddressController); // Cập nhật địa chỉ theo ID
router.delete("/:addressId", authMiddleWare, deleteAddressController); // Xóa địa chỉ theo ID

export default router;