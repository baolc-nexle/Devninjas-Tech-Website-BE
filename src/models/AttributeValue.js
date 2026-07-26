import mongoose from "mongoose";

const attributeValueSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
    },

    // Gợi ý thay thế:
    swatch: {
      type: String, // Lưu mã màu #FF0000 hoặc URL ảnh
      default: null,
    },

    attributeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attribute",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "AttributeValue",
  attributeValueSchema
);