import mongoose from "mongoose";
import Category from "../models/Category.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      // Thêm trường này để lưu TỔNG tồn kho
      type: Number,
      default: 0,
      min: 0,
    },

    soldCount: { type: Number, default: 0 }, // Cần thiết cho mục "Bán chạy"

    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"],
      default: "Active",
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    isDeleted: { type: Boolean, default: false },

    // --- THÊM PHẦN THÔNG SỐ KỸ THUẬT VÀO ĐÂY ---
   specifications: [
      {
        key: { type: String, required: true },   // Ví dụ: "Màn hình", "RAM", "CPU"
        value: { type: String, required: true }  // Ví dụ: "6.7 inch", "8GB", "Apple M2"
      }
    ],

    // THÊM ĐOẠN NÀY VÀO SCHEMA CỦA PRODUCT
    variants: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ProductVariant' // Tên này phải trùng với tên model trong file models/Variant.js
    }]
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
