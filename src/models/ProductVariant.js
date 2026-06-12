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

    attributes: {
      type: Map,
      of: String,
      required: true,
      // ví dụ:
      // { color: "Black", storage: "128GB" }
    },

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
