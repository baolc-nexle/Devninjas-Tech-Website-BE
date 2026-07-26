import ProductVariant from "../models/ProductVariant.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export const createVariant = async (data) => {
  // data đã bao gồm 'attributes' là mảng các object: [{attributeValueId: "..."}]
  let { productId, sku, price, stock, attributes, ...rest } = data;

  // 1. Validate dữ liệu cơ bản
  if (!sku) throw new Error("Mã SKU là bắt buộc");
  sku = sku.trim().toUpperCase();

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("productId không hợp lệ");
  }

  // 2. Validate attributes
  if (!Array.isArray(attributes) || attributes.length === 0) {
    throw new Error("Biến thể phải có ít nhất một thuộc tính");
  }

  // 3. Kiểm tra trùng lặp cấu hình (Cải tiến)
  const attributeIds = attributes.map(a => a.attributeValueId);
  
  // Thêm điều kiện $size để đảm bảo tổ hợp thuộc tính là DUY NHẤT 
  // (Ví dụ: biến thể 2 thuộc tính không được trùng với biến thể có 3 thuộc tính mà chứa 2 cái kia)
  const existVariant = await ProductVariant.findOne({
    productId,
    "attributes": { 
        $all: attributes.map(a => ({ attributeValueId: a.attributeValueId })),
        $size: attributes.length 
    }
  });

  if (existVariant) {
    throw new Error("Sản phẩm này đã có biến thể với cấu hình này rồi!");
  }

  const product = await Product.findById(productId);
  if (!product) throw new Error("Sản phẩm không tồn tại");

  const existSku = await ProductVariant.findOne({ sku });
  if (existSku) throw new Error("Mã SKU này đã tồn tại");

  const numPrice = Number(price);
  const numStock = Number(stock);

  if (isNaN(numPrice) || numPrice <= 0) throw new Error("Giá bán không hợp lệ");
  if (isNaN(numStock) || numStock < 0) throw new Error("Tồn kho không hợp lệ");

  // 4. Tạo mới
  const variant = await ProductVariant.create({
    productId,
    sku,
    price: numPrice,
    stock: numStock,
    attributes: attributes, 
    ...rest,
  });

  if (variant) {
    await Product.findByIdAndUpdate(productId, {
      $push: { variants: variant._id }
    });
  }

  return variant;
};

export const getVariantsByProduct = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("productId không hợp lệ");
  }

 // Populate sâu tương tự như getVariantById
  return await ProductVariant.find({ productId, isActive: true })
    .populate({
      path: "attributes.attributeValueId",
      populate: { path: "attributeId" } // Populate để lấy được name ("Màu sắc", "Dung lượng")
    });
};

export const getVariantById = async (variantId) => {
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new Error("variantId không hợp lệ");
  }

  const variant = await ProductVariant.findById(variantId)
    .populate("productId")
    .populate({
      path: "attributes.attributeValueId",
      populate: { path: "attributeId" } // Populate thêm để lấy tên thuộc tính (Màu/Dung lượng)
    });

  if (!variant) throw new Error("variant không tồn tại");

  return variant;
};

export const updateVariant = async (variantId, data) => {
  // 1. TRÍCH XUẤT DỮ LIỆU ĐÚNG TỪ MẢNG VARIANTS
  // Kiểm tra nếu 'data' có mảng 'variants', lấy phần tử đầu tiên
  const actualData = (data.variants && Array.isArray(data.variants)) 
    ? data.variants[0] 
    : data;

  console.log("DEBUG - Dữ liệu sau khi trích xuất:", actualData);

  if (!mongoose.Types.ObjectId.isValid(variantId)) throw new Error("variantId không hợp lệ");

  const updatePayload = {};

  // 2. SỬ DỤNG 'actualData' ĐỂ GÁN VÀO PAYLOAD
  if (actualData.sku !== undefined) updatePayload.sku = String(actualData.sku).trim().toUpperCase();
  if (actualData.price !== undefined) updatePayload.price = Number(actualData.price);
  if (actualData.stock !== undefined) updatePayload.stock = Number(actualData.stock);
  if (actualData.isDefault !== undefined) {
    updatePayload.isDefault = actualData.isDefault === 'true' || actualData.isDefault === true;
  }
  
  if (actualData.image) updatePayload.image = actualData.image;
  if (actualData.existingImage) updatePayload.image = actualData.existingImage;

  if (actualData.attributes) {
    try {
      updatePayload.attributes = typeof actualData.attributes === 'string' 
        ? JSON.parse(actualData.attributes) 
        : actualData.attributes;
    } catch (e) {
      console.error("Lỗi parse attributes:", e);
    }
  }

  console.log("DEBUG - Payload cuối cùng:", updatePayload);

  const updatedVariant = await ProductVariant.findOneAndUpdate(
    { _id: variantId },
    { $set: updatePayload },
    { returnDocument: 'after', runValidators: true }
  );

  if (!updatedVariant) throw new Error("Variant không tồn tại");

  return updatedVariant;
};

export const deleteVariant = async (variantId) => {
  if (!mongoose.Types.ObjectId.isValid(variantId)) throw new Error("variantId không hợp lệ");

  const variant = await ProductVariant.findById(variantId);
  if (!variant) throw new Error("Variant không tồn tại");

  variant.isActive = false;
  await variant.save();

  return variant;
};

export const syncVariants = async (productId, variantsData) => {
  const results = [];
  for (const item of variantsData) {
    if (item._id && mongoose.Types.ObjectId.isValid(item._id)) {
      results.push(await updateVariant(item._id, item));
    } else {
      const { _id, ...createData } = item;
      results.push(await createVariant({ ...createData, productId }));
    }
  }
  return results;
};