import ProductVariant from "../models/ProductVariant.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export const createVariant = async (data) => {
  let { productId, sku, price, stock, attributes, ...rest } = data;

  // ✅ Sửa lỗi trim(): Kiểm tra sku có tồn tại không trước khi trim
  if (!sku) {
    throw new Error("Mã SKU là bắt buộc");
  }
  sku = sku.trim().toUpperCase();

  // ✅ Kiểm tra productId
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("productId không hợp lệ");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // ✅ Kiểm tra trùng SKU
  const existSku = await ProductVariant.findOne({ sku });
  if (existSku) {
    throw new Error("Mã SKU này đã tồn tại trên hệ thống");
  }

  // ✅ Ép kiểu số (Vì FormData gửi số dưới dạng chuỗi)
  const numPrice = Number(price);
  const numStock = Number(stock);

  if (isNaN(numPrice) || numPrice <= 0) {
    throw new Error("Giá bán phải là số và lớn hơn 0");
  }

  if (isNaN(numStock) || numStock < 0) {
    throw new Error("Số lượng tồn kho không hợp lệ");
  }

  // ✅ Tạo biến thể
  const variant = await ProductVariant.create({
    productId,
    sku,
    price: numPrice,
    stock: numStock,
    attributes, // Controller cần đảm bảo cái này đã được JSON.parse
    ...rest,
  });

  return variant;
};

export const getVariantsByProduct = async (productId) => {
  // 1. validate productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("productId không hợp lệ");
  }

  // 2. check exist product
  const product = await Product.findById(productId);

  // 3. get variants
  const variants = await ProductVariant.find({
    productId,
  });

  console.log("Số lượng biến thể tìm thấy tại Service:", variants.length);
  console.log("Dữ liệu biến thể:", variants);

  return variants;
};

export const getVariantById = async (variantId) => {
  // 1. validate productId
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new Error("variantId không hợp lệ");
  }

  // 2. find variant và populate productId lấy dữ liệu
  const variant =
    await ProductVariant.findById(variantId).populate("productId");

  if (!variant) {
    throw new Error("variant không tồn tại");
  }

  return variant;
};

export const updateVariant = async (variantId, data) => {
  // 1. validate id
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new Error("variantId không hợp lệ");
  }

  // 2. find variant
  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error("Variant không tồn tại");
  }

  // 3. không cho update product
  if (data.productId) {
    delete data.productId;
  }

  // 4. normalize SKU nếu có
  if (data.sku) {
    data.sku = data.sku.trim().toUpperCase();

    const existSku = await ProductVariant.findOne({
      sku: data.sku,
      _id: { $ne: variantId },
    });

    if (existSku) {
      throw new Error("SKU đã tồn tại");
    }
  }

  // 5. validate price nếu có
  if (data.price !== undefined && data.price <= 0) {
    throw new Error("Giá không hợp lệ");
  }

  // 6. validate stock nếu có
  if (data.stock !== undefined && data.stock < 0) {
    throw new Error("Stock không hợp lệ");
  }

  // 7. update
  Object.assign(variant, data);

  await variant.save();

  return variant;
};

export const deleteVariant = async (variantId) => {
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new Error("variantId không hợp lệ");
  }

  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error("Variant không tồn tại");
  }

  // soft delete
  variant.isActive = false;

  await variant.save();

  return variant;
};

// Thêm hàm này vào cùng file service của bạn
export const syncVariants = async (productId, variantsData) => {
  const results = [];

  for (const item of variantsData) {
    // KIỂM TRA: Nếu có _id hợp lệ thì mới gọi logic update cũ của bạn
    if (item._id && mongoose.Types.ObjectId.isValid(item._id)) {
      const updated = await updateVariant(item._id, item);
      results.push(updated);
    }
    // TRƯỜNG HỢP: Biến thể mới (không có _id hoặc _id không hợp lệ)
    else {
      // Ở đây bạn có thể gọi hàm createVariant của mình hoặc logic tạo mới
      const { _id, ...createData } = item; // Loại bỏ ID tạm từ frontend nếu có

      // Validate sơ bộ cho biến thể mới trước khi lưu
      if (!createData.sku) throw new Error("Biến thể mới bắt buộc phải có SKU");

      const newVariant = await ProductVariant.create({
        ...createData,
        productId: productId, // Gắn ID sản phẩm cha
      });
      results.push(newVariant);
    }
  }

  return results;
};
