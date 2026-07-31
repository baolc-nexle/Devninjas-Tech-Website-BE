import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getChatbotResponseService = async (userMessage) => {
  try {
    // Bước 1: Tách từ khóa từ câu hỏi của khách để tìm kiếm MongoDB linh hoạt hơn (tránh lệch khớp chuỗi dài)
    const keywords = userMessage.split(" ").filter(word => word.length > 1);
    const searchQueryConditions = keywords.map(keyword => ({
      name: { $regex: keyword, $options: 'i' }
    }));

    // Tìm kiếm kết hợp cả câu và từng từ khóa lẻ trong name, description, category
    const matchedProducts = await Product.find({
      $or: [
        { name: { $regex: userMessage, $options: 'i' } },
        { description: { $regex: userMessage, $options: 'i' } },
        { category: { $regex: userMessage, $options: 'i' } },
        ...searchQueryConditions
      ]
    })
    .populate('variants')
    .limit(5); // Lấy tối đa 5 sản phẩm

    const contextData = matchedProducts.length > 0 
      ? JSON.stringify(matchedProducts, null, 2) 
      : "Không tìm thấy sản phẩm cụ thể, hãy tư vấn các sản phẩm nổi bật hiện có trong hệ thống.";

    // Bước 2: System Prompt với quy tắc ép buộc AI phải chốt sản phẩm tư vấn
    const systemInstruction = `Bạn là trợ lý nhân viên tư vấn bán hàng thông minh, thân thiện của website thương mại điện tử. 
    
QUY TẮC BẮT BUỘC:
- Dữ liệu sản phẩm và mảng 'variants' (phiên bản, giá cả, màu sắc) được cung cấp từ kho dữ liệu MongoDB bên dưới.
- BẮT BUỘC PHẢI chọn và giới thiệu ít nhất từ 1 đến 3 sản phẩm có trong "KHO DỮ LIỆU SẢN PHẨM" để tư vấn trực tiếp cho khách. 
- Tuyệt đối KHÔNG ĐƯỢC né tránh bằng cách hỏi ngược lại khách quá nhiều câu hỏi vòng vo nếu trong kho đã có sản phẩm. Hãy chỉ ra luôn sản phẩm phù hợp nhất và giải thích lý do vì sao nên mua.
- Nếu khách hỏi tầm giá hoặc phân khúc, hãy lọc ra các biến thể có mức giá sát nhất để tư vấn.
- Tuyệt đối không tự bịa đặt thông tin, giá bán hay phiên bản không có trong dữ liệu.`;

    const userPrompt = `KHO DỮ LIỆU SẢN PHẨM TRÊN HỆ THỐNG:\n${contextData}\n\nCÂU HỎI VÀ NHU CẦU CỦA KHÁCH HÀNG: "${userMessage}"`;

    // Bước 3: Gọi Gemini DUY NHẤT 1 LẦN để tạo câu trả lời tư vấn cuối cùng cho khách
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { 
          role: 'user', 
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] 
        }
      ],
      config: {
        temperature: 0.7,
      }
    });

    const aiReply = response.text;

    if (!aiReply) {
      throw new Error("Không nhận được phản hồi từ AI.");
    }

    // Trả về cả câu trả lời của AI và danh sách sản phẩm tìm được để Frontend hiển thị card
    return {
      reply: aiReply,
      products: matchedProducts
    };

  } catch (error) {
    console.error("Lỗi Service Chatbot Gemini:", error);
    throw new Error("Không thể xử lý yêu cầu từ AI lúc này.");
  }
};