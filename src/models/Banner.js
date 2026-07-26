import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Slug để định danh hoặc hỗ trợ SEO nếu banner trỏ về một landing page
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Hình ảnh cho Desktop
    imageUrl: {
      type: String,
      required: true,
    },
    // Hình ảnh cho Mobile (tối ưu trải nghiệm trên thiết bị nhỏ)
    mobileImageUrl: {
      type: String,
      default: "",
    },
    // Thông tin nút kêu gọi hành động (CTA)
    cta: {
      text: { type: String, default: "Mua ngay" },
      url: { type: String, default: "#" },
    },
    // Thứ tự hiển thị (dùng để sắp xếp trong Slider)
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Phân loại vị trí (ví dụ: 'homepage_hero', 'sale_banner')
    position: {
      type: String,
      required: true,
      index: true,
    },
    // Thời gian hiển thị tự động
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Đánh Index để tối ưu truy vấn
bannerSchema.index({ position: 1, isActive: 1, displayOrder: 1 });

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;