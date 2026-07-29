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

// 👉 THÊM HÀM NÀY VÀO ĐỂ GỬI MAIL HỦY ĐƠN
export const sendCancelOrderEmail = async (toEmail, orderCode, cancelReason) => {
  const subject = `[Thông báo] Đơn hàng #${orderCode} đã bị hủy`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #e11d48; margin-top: 0;">Thông Báo Hủy Đơn Hàng</h2>
      <p>Xin chào quý khách,</p>
      <p>Rất tiếc phải thông báo rằng đơn hàng mã <strong style="color: #0f172a;">#${orderCode}</strong> của bạn đã bị hủy bởi quản trị viên.</p>
      
      <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #e11d48; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Lý do hủy đơn:</p>
        <p style="margin: 0; color: #334155; font-style: italic;">"${cancelReason}"</p>
      </div>

      <p>Nếu bạn có bất kỳ thắc mắc nào hoặc cần hỗ trợ thêm, vui lòng phản hồi lại email này.</p>
      <p style="margin-bottom: 0;">Trân trọng,<br><strong style="color: #0f172a;">Website Technology</strong></p>
    </div>
  `;

  // Tái sử dụng lại chính hàm sendEmail có sẵn của bạn
  await sendEmail(toEmail, subject, htmlContent);
};