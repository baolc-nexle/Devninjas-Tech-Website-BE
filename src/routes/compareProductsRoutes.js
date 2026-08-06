import express from 'express';
import { handleCompareProducts } from '../controllers/compareProductsController.js'; // Đường dẫn tới controller bạn vừa tạo ở Bước 2

const router = express.Router();

// Định nghĩa phương thức POST cho tính năng so sánh sản phẩm bằng AI
router.post('/compare-products', handleCompareProducts);

export default router;