import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    // Dùng để tạo đường dẫn thân thiện (ví dụ: dien-thoai, laptop-gaming)
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String, // Ảnh đại diện danh mục
      default: "",
    },
    icon: {
      type: String, // Icon để hiển thị trên menu hoặc thẻ danh mục
      default: "",
    },
    // TRƯỜNG MỚI: Đánh dấu danh mục nổi bật để hiển thị ở trang chủ
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // TRƯỜNG MỚI: Thứ tự ưu tiên hiển thị (danh mục nào muốn hiện trước thì đặt số nhỏ)
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    // Lưu ý: Không nên lưu product_count ở đây nếu bạn muốn dữ liệu luôn chính xác,
    // trừ khi bạn chạy job định kỳ hoặc update thủ công mỗi khi thêm sản phẩm.
    product_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index cho slug để tìm kiếm nhanh hơn
categorySchema.index({ slug: 1 });

const Category = mongoose.model("Category", categorySchema);
export default Category;