import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      unique: true, // Đảm bảo mỗi biến thể chỉ có 1 bản ghi kho
      index: true,
    },

    // Số lượng đang bị giữ (ví dụ: khách đã đặt đơn chưa thanh toán)
    // Trường này là điểm mấu chốt để không bán trùng hàng
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tổng số lượng đã bán thành công (thống kê doanh số nhanh)
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Ngưỡng cảnh báo kho (để biết khi nào cần nhập hàng)
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;