import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js'; // Đã thêm dấu '=' chuẩn xác
import OpenAI from 'openai';

// Khởi tạo kết nối với Groq API
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const getChatbotResponseService = async (userMessage) => {
  try {
    // Bước 1: Tìm sản phẩm từ MongoDB và dùng .populate() để kéo dữ liệu từ bảng Variant sang
    const matchedProducts = await Product.find({
      $or: [
        { name: { $regex: userMessage, $options: 'i' } },
        { description: { $regex: userMessage, $options: 'i' } }
      ]
    })
    .populate('variants') // Lệnh này giúp kéo toàn bộ thông tin chi tiết từ bảng Variant sang
    .limit(3); 

    const contextData = matchedProducts.length > 0 
      ? JSON.stringify(matchedProducts, null, 2) 
      : "Không tìm thấy sản phẩm nào khớp trong kho dữ liệu hiện tại.";

    // Bước 2: Gọi API của AI (Groq - Llama 3) với System Prompt hướng dẫn đọc dữ liệu từ bảng riêng
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý nhân viên tư vấn bán hàng thông minh, thân thiện của website thương mại điện tử. 
          
          QUY TẮC BẮT BUỘC:
          - Dữ liệu cung cấp bao gồm thông tin sản phẩm và mảng 'variants' được liên kết từ bảng biến thể riêng biệt.
          - Khi khách hàng hỏi chi tiết về phiên bản, màu sắc, cấu hình hoặc giá cụ thể, hãy khai thác từ mảng 'variants' đã được đính kèm trong mỗi sản phẩm để tư vấn chính xác.
          - Tuyệt đối không tự bịa đặt thông tin, giá bán hay phiên bản không có trong dữ liệu.
          - Nếu không tìm thấy sản phẩm hoặc biến thể phù hợp, hãy lịch sự thông báo và hướng dẫn khách liên hệ.`
        },
        {
          role: 'user',
          content: `DỮ LIỆU SẢN PHẨM VÀ BIẾN THỂ (Từ các bảng MongoDB):\n${contextData}\n\nCÂU HỎI CỦA KHÁCH HÀNG: "${userMessage}"`
        }
      ],
      temperature: 0.7,
    });

    const aiReply = completion.choices[0].message.content;
    return aiReply;

  } catch (error) {
    console.error("Lỗi Service Chatbot:", error);
    throw new Error("Không thể xử lý yêu cầu từ AI lúc này.");
  }
};