import mongoose from "mongoose";

const flashSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: { 
      type: String,
      default: "",
    },

    startTime: {
      type: Date,
      required: true,
      index: true
    },

    endTime: {
      type: Date,
      required: true,
      index: true
    },

    isActive: { type: Boolean, default: true }, // Cực quan trọng để tắt/mở nhanh
    priority: { type: Number, default: 0 },      // Để sắp xếp tab 12h, 15h, 18h

    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Ended"],
      default: "Upcoming",
    },
  },
  {
    timestamps: true,
  }
);

const FlashSale = mongoose.model("FlashSale", flashSaleSchema);
export default FlashSale;