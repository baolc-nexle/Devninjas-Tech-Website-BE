import mongoose from "mongoose";
const flashSaleItemSchema = new mongoose.Schema(
  {
    flashSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FlashSale",
      required: true,
    },
    // Liên kết trực tiếp tới biến thể
    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant", 
      required: true,
    },
    // Vẫn nên giữ product_id để dễ dàng Query danh sách sản phẩm theo chiến dịch
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    flash_price: { type: Number, required: true },
    stock: { type: Number, required: true },
    sold_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const FlashSaleItem = mongoose.model("FlashSaleItem", flashSaleItemSchema);
export default FlashSaleItem;