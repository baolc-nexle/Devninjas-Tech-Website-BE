import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    compareAtPrice: {
      type: Number,
      default: null, // giá gốc (để hiển thị sale)
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // THÊM TRƯỜNG NÀY VÀO:
    attributes: [
      {
        attributeValueId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AttributeValue", // Trỏ đến bảng AttributeValue của bạn
          required: true,
        },
      },
    ],

    image: {
      type: String,
      default: "",
    },

    images: [
      {
        type: String,
      },
    ],

    weight: {
      type: Number,
      default: 0, // dùng cho shipping
    },

    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: { type: Boolean, default: false },

    isDefault: {
      type: Boolean,
      default: false, // variant mặc định khi load product
    },

    reservedStock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
