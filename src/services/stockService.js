import mongoose from "mongoose";
import ProductVariant from "../models/ProductVariant.js";
import * as inventoryService from "./inventoryService.js";

export const checkStock = async (variantId, quantity) => {
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new Error("VariantId không hợp lệ");
  }

  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error("variant không tồn tại");
  }

  if (!variant.isActive) {
    throw new Error("Variant không còn bán");
  }

  if (variant.stock < quantity) {
    throw new Error("Không đủ hàng trong kho");
  }

  return true;
};

export const decreaseStock = async (variantId, quantity) => {
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new Error("VariantId không hợp lệ");
  }

  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error("variant không tồn tại");
  }

  if (!variant.isActive) {
    throw new Error("Variant không còn bán");
  }

  if (variant.stock < quantity) {
    throw new Error("Không đủ hàng để trừ");
  }

  variant.stock -= quantity;

  await variant.save();

  return variant;
};

export const increaseStock = async (variantId, quantity) => {
  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new Error("VariantId không hợp lệ");
  }

  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error("variant không tồn tại");
  }

  if (!variant.isActive) {
    throw new Error("Variant không còn bán");
  }

  variant.stock += quantity;

  await variant.save();

  return variant;
};

export const validateCartStock = async (items) => {
  if (!items || items.length === 0) {
    throw new Error("Cart trống");
  }

  // 1. Lấy tất cả variantId (Xử lý trường hợp đã populate hoặc chưa)
  const variantIds = items.map((i) => {
    // Nếu i.variantId là object thì lấy _id, nếu không thì lấy trực tiếp
    return i.variantId._id ? i.variantId._id : i.variantId;
  });

  // 2. Query 1 lần
  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
  });

  const variantMap = new Map();
  variants.forEach((v) => {
    variantMap.set(v._id.toString(), v);
  });

  // 4. Validate từng item
  for (const item of items) {
    // Lấy ID chuẩn dạng string
    const vId = item.variantId._id ? item.variantId._id.toString() : item.variantId.toString();
    const variant = variantMap.get(vId);

    // ❌ Nếu không tìm thấy trong DB
    if (!variant) {
      console.log("Lỗi: Không tìm thấy variant trong map với ID:", vId);
      throw new Error("Variant không tồn tại");
    }

    // ❌ bị disable
    if (!variant.isActive) {
      throw new Error(`Variant ${variant.sku} không còn bán`);
    }

    // ❌ không đủ stock
    if (variant.stock < item.quantity) {
      throw new Error(`Không đủ hàng cho ${variant.sku}`);
    }
  }

  return true;
};

// export const reserveStock = async (variantId, quantity) => {
//   const variant = await ProductVariant.findById(variantId);

//   if (!variant) {
//     throw new Error("Variant không tồn tại");
//   }

//   if (!variant.isActive) {
//     // is active = true là còn bán
//     throw new Error("Variant không còn bán");
//   }
//   // check đủ hàng khả dụng
//   const availableStock = variant.stock - variant.reservedStock;

//   if (availableStock < quantity) {
//     throw new Error("Không đủ hàng để giữ");
//   }

//   // giữ hàng
//   variant.reservedStock += quantity;

//   await variant.save();

//   return variant;
// };

export const reserveStock = async (variantId, quantity) => {
  return await inventoryService.reserveStock(variantId, quantity);
};

// export const releaseStock = async (variantId, quantity) => {
//   const variant = await ProductVariant.findById(variantId);

//   if (!variant) {
//     throw new Error("Variant không tồn tại");
//   }

//   // không cho âm reservedStock
//   variant.reservedStock -= quantity;

//   if (variant.reservedStock < 0) {
//     variant.reservedStock = 0;
//   }

//   await variant.save();

//   return variant;
// };

export const releaseStock = async (variantId, quantity) => {
  return await inventoryService.releaseStock(variantId, quantity);
};

// export const confirmStock = async (variantId, quantity) => {
//   console.log("DECREASE START");
//   const variant = await ProductVariant.findById(variantId);

//   console.log("variant", variant);
//   if (!variant) {
//     throw new Error("Variant không tồn tại");
//   }

//   if (variant.reservedStock < quantity) {
//     throw new Error("Không đủ hàng đã giữ");
//   }

//   // 🔥 quan trọng
//   variant.stock -= quantity;
//   variant.reservedStock -= quantity;

//   await variant.save();

//   console.log("DECREASE DONE");

//   return variant;
// };

export const confirmStock = async (variantId, quantity) => {
  return await inventoryService.confirmStock(variantId, quantity);
};
