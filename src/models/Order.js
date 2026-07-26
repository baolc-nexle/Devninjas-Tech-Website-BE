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

    receiverName: {
      type: String,
      required: false,
      trim: true,
    },

    receiverPhone: {
      type: String,
      required: false,
      trim: true,
    },

    receiverEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },

    province: {
      type: String,
      required: false,
      trim: true,
    },

    ward: {
      type: String,
      required: false,
      trim: true,
    },

    address: {
      type: String,
      required: false,
      trim: true,
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
        "draft",
      ],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "stripe"], // Giới hạn chỉ được chọn 2 loại này
      required: true,
    },

    cancelReason: {
      type: String,
      default: null,
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

// Thêm đoạn này trước khi export model Order
orderSchema.index({ 
  orderCode: 'text', 
  receiverName: 'text', 
  receiverPhone: 'text', 
  receiverEmail: 'text' 
});

export default Order;
