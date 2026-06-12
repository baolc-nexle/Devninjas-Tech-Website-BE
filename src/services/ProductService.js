import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { syncVariants } from "./productVariantService.js";
import ProductVariant from "../models/ProductVariant.js";
import mongoose from "mongoose";

// check format id
const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID không hợp lệ");
  }
};

// get all
export const getAllProducts = async () => {
  return await Product.find()
    .sort({ createdAt: -1 })
    .populate("categoryId", "name");
};

// get by id
export const getProductById = async (id) => {
  validateId(id);

  const product = await Product.findById(id);

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  return product;
};

// create
export const createProduct = async (data) => {
  // 1. Validation (Giữ nguyên các check của bạn)
  if (!data || Object.keys(data).length === 0) {
    throw new Error("Dữ liệu không được để trống");
  }
  if (!data.name || data.name.trim() === "") {
    throw new Error("Tên sản phẩm không được để trống");
  }
  if (!data.categoryId) {
    throw new Error("Danh mục không được để trống");
  }

  // 2. Kiểm tra category (Giữ nguyên)
  const category = await Category.findById(data.categoryId);
  if (!category) {
    throw new Error("Danh mục không tồn tại");
  }

  console.log("Check data.stock", data.stock);

  // Kiểm tra nếu stock gửi lên là string (do FormData luôn gửi string), hãy ép về Number
  const finalStock = Number(data.stock) || 0;
  // Thêm log để bắt bệnh

  // 4. Tạo sản phẩm với trường stock đã tính tổng
  const productData = {
    ...data,
    stock: finalStock, // Gán giá trị tổng vào đây để lưu vào DB
  };

  const newProduct = await Product.create(productData);
  // --- KẾT THÚC PHẦN XỬ LÝ MỚI ---

  // 5. Cập nhật product_count cho category (Giữ nguyên)
  await Category.findByIdAndUpdate(data.categoryId, {
    $inc: { product_count: 1 },
  });

  return newProduct;
};

// update
export const updateProduct = async (id, data) => {
  validateId(id);

  if (!data || Object.keys(data).length === 0) {
    throw new Error("Không có dữ liệu để cập nhật");
  }

  // tách variants ra khỏi product data
  const { variants, ...productData } = data;

  // update product
  const product = await Product.findByIdAndUpdate(id, productData, {
    new: true,
  });

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // sync variants
  if (variants && Array.isArray(variants)) {
    await syncVariants(id, variants);
  }

  return product;
};

// delete
export const deleteProduct = async (id) => {
  validateId(id);

  // 1. Tìm product trước
  const product = await Product.findById(id);

  const category = await Category.findById(product.categoryId);

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  await ProductVariant.deleteMany({ productId: id }); // Xóa hết biến thể liên quan đến sản phẩm này

  // 2. Xóa product
  await Product.findByIdAndDelete(id);

  // 3. Giảm product_count (chỉ khi active)
  if (product.status === "Active") {
    await Category.findByIdAndUpdate(
      product.categoryId,
      {
        $inc: { product_count: -1 },
      },
      { new: true },
    );
  }

  return {
    message: "Xóa sản phẩm thành công",
  };
};
