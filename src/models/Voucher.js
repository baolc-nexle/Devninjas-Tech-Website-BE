import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    minOrderValue: {
      type: Number,
      default: 0,
    },

    maxDiscount: {
      type: Number,
      default: null,
    },

    usageLimit: {
      type: Number,
      default: 1, // 0 = unlimited
    },

    usageLimitPerUser: {
      type: Number,
      default: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    name: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        default: "",
    },

    applyTo: {
        type: String,
        enum: ["all_products", "categories", "vip_users"],
        default: "all_products",
    },

  },
  {
    timestamps: true,
  },
);

const Voucher = mongoose.model("Voucher", voucherSchema);

export default Voucher;
