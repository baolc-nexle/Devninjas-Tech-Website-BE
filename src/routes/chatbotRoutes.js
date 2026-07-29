import express from 'express';
import { handleChatbotConsultation } from '../controllers/chatbotController.js';

const router = express.Router();

// Định nghĩa phương thức POST cho endpoint tư vấn sản phẩm
// Đường dẫn hoàn chỉnh sẽ là: /api/chatbot/consultation
router.post('/consultation', handleChatbotConsultation);

export default router;