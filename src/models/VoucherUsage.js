import mongoose from "mongoose";

const voucherUsageSchema = new mongoose.Schema({
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Voucher",
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },

  usedAt: {
    type: Date,
    default: Date.now,
  },
});

const VoucherUsage = mongoose.model("VoucherUsage", voucherUsageSchema);
export default VoucherUsage;
