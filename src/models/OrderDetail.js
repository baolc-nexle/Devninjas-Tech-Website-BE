import mongoose from "mongoose";

const orderDetailSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    name: String,
    image: String,
    sku: String,

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// 🔥 index nâng cao (production)
orderDetailSchema.index({ orderId: 1 });
orderDetailSchema.index({ variantId: 1 });

const OrderDetail = mongoose.model("OrderDetail", orderDetailSchema);

export default OrderDetail;
