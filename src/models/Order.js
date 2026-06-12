import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    // 🔥 NEW: voucher đã dùng
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      default: null,
    },

    // 🔥 NEW: số tiền giảm
    discount: {
      type: Number,
      default: 0,
    },

    // 🔥 NEW: tổng tiền trước khi giảm
    subtotal: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      default: "COD",
    },

    // 🔥 nên thêm

    orderCode: {
      type: String,
      required: true,
      unique: true,
    },

    paidAt: Date,
    cancelledAt: Date,

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
