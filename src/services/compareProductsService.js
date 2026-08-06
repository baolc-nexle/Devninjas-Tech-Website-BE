import Product from '../models/Product.js';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const compareProductsService = async (productIds, userNeed) => {
  try {
    // 1. Kiểm tra đầu vào tối thiểu phải có từ 2 sản phẩm để so sánh
    if (!productIds || productIds.length < 2) {
      throw new Error("Cần cung cấp ít nhất 2 sản phẩm để thực hiện so sánh.");
    }

    // 2. Truy vấn lấy thông tin chi tiết các sản phẩm từ MongoDB cùng variants
    const productsToCompare = await Product.find({
      _id: { $in: productIds }
    }).populate('variants');

    if (productsToCompare.length < 2) {
      throw new Error("Không tìm thấy đủ thông tin sản phẩm trong hệ thống.");
    }

    const contextData = JSON.stringify(productsToCompare, null, 2);

    // 3. System Prompt chuyên gia định hướng cho AI phân tích và đưa ra quyết định
    const systemInstruction = `Bạn là một chuyên gia tư vấn công nghệ và thương mại điện tử cao cấp, trung thực và khách quan.
    
NHIỆM VỤ:
- Phân tích và đối chiếu trực tiếp các sản phẩm được cung cấp trong "KHO DỮ LIỆU SẢN PHẨM".
- Đặt nhu cầu thực tế của khách hàng ("${userNeed}") làm trọng tâm để đánh giá xem máy nào đáp ứng tốt hơn.
- Cấu trúc câu trả lời rõ ràng, mạch lạc, chuyên nghiệp:
  1. **Đánh giá tổng quan**: Phân tích ngắn gọn ưu/nhược điểm cốt lõi của từng sản phẩm khi đặt cạnh nhau.
  2. **So sánh theo tiêu chí**: (Hiệu năng/Chip, Pin, Màn hình, Giá bán dựa trên variants).
  3. **Lời khuyên quyết định cuối cùng**: Chỉ rõ sản phẩm nào là lựa chọn TỐT NHẤT cho nhu cầu "${userNeed}" và giải thích lý do thuyết phục tại sao khách nên chốt đơn sản phẩm đó.
- Tuyệt đối không bịa đặt thông số kỹ thuật ngoài dữ liệu được cung cấp.`;

    const userPrompt = `KHO DỮ LIỆU SẢN PHẨM CẦN SO SÁNH:\n${contextData}\n\nNHU CẦU THỰC TẾ CỦA KHÁCH HÀNG: "${userNeed}"`;

    // 4. Gọi Gemini Model chuẩn Production (sử dụng gemini-2.5-flash hoặc gemini-3.5-flash)
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { 
          role: 'user', 
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] 
        }
      ],
      config: {
        temperature: 0.4, // Giảm độ sáng tạo để AI tập trung phân tích chính xác thông số thực tế
      }
    });

    const aiReply = response.text;

    if (!aiReply) {
      throw new Error("Không nhận được phản hồi phân tích từ AI.");
    }

    // Trả về bài phân tích của AI kèm theo data sản phẩm để Frontend dựng giao diện so sánh trực quan
    return {
      analysis: aiReply,
      products: productsToCompare
    };

  } catch (error) {
    console.error("Lỗi AI so sánh sản phẩm:", error);
    throw new Error(error.message || "Không thể thực hiện so sánh sản phẩm lúc này.");
  }
};