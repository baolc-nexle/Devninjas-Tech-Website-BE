import mongoose from "mongoose";

const categoryAndAttributesSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Trỏ đến bảng Category của bạn
      required: true,
      index: true, // Thêm index để truy vấn nhanh hơn
    },
    attributeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attribute", // Trỏ đến bảng Attribute (Dung lượng, Màu sắc...)
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo không bị trùng lặp cặp Category - Attribute
categoryAndAttributesSchema.index({ categoryId: 1, attributeId: 1 }, { unique: true });

export default mongoose.model("CategoryAndAttributes", categoryAndAttributesSchema);