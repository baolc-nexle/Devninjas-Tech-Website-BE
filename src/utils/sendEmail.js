import nodemailer from "nodemailer";

// Cấu hình transporter (tái sử dụng kết nối)
const transporter = nodemailer.createTransport({
  service: "gmail", // Dùng gmail làm dịch vụ gửi
  auth: {
    user: process.env.EMAIL_USER, // Email của bạn
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng 16 ký tự ở Bước 2
  },
});

export const sendEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"Website Technology" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent, // Dùng HTML để link trông chuyên nghiệp
    });
    console.log("Email đã được gửi thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    throw new Error("Không thể gửi email khôi phục.");
  }
};