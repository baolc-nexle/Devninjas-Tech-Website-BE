import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    // =========================================================
    // 1. NHÓM LIÊN KẾT NGHIỆP VỤ (RELATIONSHIPS)
    // =========================================================
    orderDetailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderDetail",
      required: true,
      unique: true, // Vẫn giữ unique để 1 chi tiết đơn hàng chỉ đánh giá 1 lần
      index: true,
    },

    // =========================================================
    // 2. NHÓM ĐÁNH GIÁ TỪ FORM GIAO DIỆN
    // =========================================================
    // Đánh giá chung (1 - 5 sao)
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Theo trải nghiệm (Hiệu năng, Pin, Camera)
    detailedRatings: {
        quality: { type: Number, min: 1, max: 5 },          // Chất lượng sản phẩm
        descriptionMatch: { type: Number, min: 1, max: 5 }, // Đúng với mô tả
        priceValue: { type: Number, min: 1, max: 5 },       // Giá cả / Giá trị
      },

    // Ô nhận xét (Tối thiểu 15 ký tự)
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [15, "Nội dung chia sẻ phải có tối thiểu 15 ký tự."],
      maxlength: [1000, "Nội dung đánh giá không vượt quá 1000 ký tự."],
    },

    // Nút "Thêm hình ảnh" -> Lưu mảng các đường dẫn ảnh (URL)
    images: [
      {
        type: String,
      },
    ],

    // =========================================================
    // 3. NHÓM QUẢN TRỊ (ADMIN / AUDIT)
    // =========================================================
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Tự động sinh createdAt và updatedAt
  }
);

// Index thời gian tạo để hỗ trợ sắp xếp review mới nhất
ratingSchema.index({ createdAt: -1 });

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;