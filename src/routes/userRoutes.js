import express from "express";
import { getAllUsers, toggleUserStatus, updateUserRole, updateProfile } from "../controllers/userController.js";
import { authMiddleWare } from "../middlewares/authMiddleware.js"; // Giả sử bạn đã có middleware này
import createUploader from "../middlewares/uploadMiddleware.js";

const router = express.Router();
const uploadUser = createUploader("users");

// Cập nhật thông tin cá nhân (name, phone, birthday, gender, avatar)
router.put("/profile", authMiddleWare, uploadUser.single("avatar"), updateProfile);

// Lấy danh sách user cho Admin
router.get("/admin/all", authMiddleWare, getAllUsers);

router.patch("/admin/status/:userId", authMiddleWare, toggleUserStatus);

// 2. Thêm route cập nhật Role
router.patch("/admin/role/:userId", authMiddleWare, updateUserRole);


export default router;