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

    // 3. System Prompt cấu trúc lại để AI tóm tắt ngắn gọn và lập bảng so sánh nhanh
    const systemInstruction = `Bạn là một chuyên gia tư vấn thương mại điện tử cấp cao. 
NHIỆM VỤ: So sánh các sản phẩm dựa trên "KHO DỮ LIỆU SẢN PHẨM" và nhu cầu của khách hàng ("${userNeed}").

YÊU CẦU ĐỊNH DẠNG TRẢ VỀ (Cực kỳ quan trọng để chống lười đọc):
Hãy trình bày ngắn gọn, súc tích theo cấu trúc sau bằng Markdown:

### 💡 LỜI KHUYÊN & QUYẾT ĐỊNH NHANH
- Viết tối đa 2-3 câu ngắn gọn chốt thẳng: Khách nên mua sản phẩm nào dựa trên nhu cầu "${userNeed}" và lý do cốt lõi.

### 📊 ĐÁNH GIÁ NHANH ƯU/NHƯỢC ĐIỂM
- **[Tên sản phẩm 1]**: Ưu điểm nổi bật nhất / Nhược điểm chính.
- **[Tên sản phẩm 2]**: Ưu điểm nổi bật nhất / Nhược điểm chính.

Tuyệt đối không viết văn bản dài dòng lan man. Dựa hoàn toàn vào thông số thực tế trong dữ liệu.`;

    const userPrompt = `KHO DỮ LIỆU SẢN PHẨM CẦN SO SÁNH:\n${contextData}\n\nNHU CẦU THỰC TẾ CỦA KHÁCH HÀNG: "${userNeed}"`;

    // 4. Gọi Gemini Model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash', // Hoặc gemini-3.5-flash tùy theo project của bạn
      contents: [
        { 
          role: 'user', 
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] 
        }
      ],
      config: {
        temperature: 0.3, // Giảm thêm để AI tập trung đúng trọng tâm, tránha sáng tạo lan man
      }
    });

    const aiReply = response.text;

    if (!aiReply) {
      throw new Error("Không nhận được phản hồi phân tích từ AI.");
    }

    // Trả về kết quả cho Controller/Frontend
    return {
      analysis: aiReply,
      products: productsToCompare // Trả kèm mảng sản phẩm gốc để Frontend render bảng thông số & card sản phẩm bên dưới
    };

  } catch (error) {
    console.error("Lỗi AI so sánh sản phẩm:", error);
    throw new Error(error.message || "Không thể thực hiện so sánh sản phẩm lúc này.");
  }
};