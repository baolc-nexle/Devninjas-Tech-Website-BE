import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Không để unique: true ở đây vì 1 User có thể có nhiều item 
      // nếu bạn coi đây là bảng chứa từng dòng sản phẩm
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true, // Thêm timestamps để quản lý thời gian
  }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;