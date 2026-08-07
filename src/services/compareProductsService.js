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

    // 3. System Prompt cấu trúc lại để AI tự động tạo văn bản đánh giá VÀ Bảng so sánh thông số
    const systemInstruction = `Bạn là một chuyên gia tư vấn công nghệ và thương mại điện tử cao cấp, trung thực và khách quan.
NHIỆM VỤ: Phân tích, đối chiếu sản phẩm và tư vấn dựa trên nhu cầu thực tế của khách hàng ("${userNeed}").

YÊU CẦU ĐỊNH DẠNG TRẢ VỀ BẮT BUỘC (Sử dụng Markdown):
Hãy trình bày báo cáo theo đúng 3 phần sau:

### 1. ĐÁNH GIÁ TỔNG QUAN & ƯU/NHƯỢC ĐIỂM
- Phân tích ngắn gọn định hướng phân khúc của từng sản phẩm.
- Nêu rõ Ưu điểm cốt lõi và Nhược điểm chính của từng máy khi đặt cạnh nhau để phục vụ nhu cầu "${userNeed}".

### 2. BẢNG SO SÁNH THÔNG SỐ KỸ THUẬT
- Hãy tự động lập một **Bảng Markdown** (Table) đối chiếu trực tiếp các thông số kỹ thuật quan trọng nhất lấy từ dữ liệu (Ví dụ các cột: Tiêu chí, [Tên Sản Phẩm 1], [Tên Sản Phẩm 2]).
- Các dòng tiêu chí gợi ý: Mức giá, Hệ điều hành/Phần mềm, Chipset/CPU, Card đồ họa (GPU), RAM/Bộ nhớ trong, Màn hình, Pin/Sạc.

### 3. LỜI KHUYÊN & QUYẾT ĐỊNH CUỐI CÙNG
- Chốt thẳng sản phẩm nào là lựa chọn TỐT NHẤT cho khách hàng và giải thích lý do ngắn gọn để khách chốt đơn.

Dựa hoàn toàn vào thông số thực tế trong kho dữ liệu, tuyệt đối không bịa đặt.`;

    const userPrompt = `KHO DỮ LIỆU SẢN PHẨM CẦN SO SÁNH:\n${contextData}\n\nNHU CẦU THỰC TẾ CỦA KHÁCH HÀNG: "${userNeed}"`;

    // 4. Gọi Gemini Model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash', 
      contents: [
        { 
          role: 'user', 
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] 
        }
      ],
      config: {
        temperature: 0.3, 
      }
    });

    const aiReply = response.text;

    if (!aiReply) {
      throw new Error("Không nhận được phản hồi phân tích từ AI.");
    }

    // Trả về kết quả cho Controller/Frontend
    return {
      analysis: aiReply,
      products: productsToCompare // Vẫn trả kèm mảng sản phẩm để Frontend vẽ 2 card bấm xem chi tiết ở tầng dưới cùng
    };

  } catch (error) {
    console.error("Lỗi AI so sánh sản phẩm:", error);
    throw new Error(error.message || "Không thể thực hiện so sánh sản phẩm lúc này.");
  }
};