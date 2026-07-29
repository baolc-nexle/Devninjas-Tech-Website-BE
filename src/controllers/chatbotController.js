import { getChatbotResponseService } from '../services/chatbotService.js';

export const handleChatbotConsultation = async (req, res) => {
  try {
    const { message } = req.body;

    // Kiểm tra xem khách hàng có gửi nội dung tin nhắn lên hay không
    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng nhập nội dung tin nhắn cần tư vấn." 
      });
    }

    // Gọi Service xử lý logic tìm kiếm MongoDB và tương tác với AI (Groq)
    const aiReply = await getChatbotResponseService(message);

    return res.status(200).json({
      success: true,
      reply: aiReply
    });

  } catch (error) {
    console.error("Lỗi Controller Chatbot:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống trong quá trình xử lý tư vấn sản phẩm." 
    });
  }
};