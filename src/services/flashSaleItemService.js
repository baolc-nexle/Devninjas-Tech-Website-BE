import FlashSaleItem from "../models/FlashSaleItem.js";
import ProductVariant from "../models/ProductVariant.js";
import mongoose from "mongoose";

// Helper validate
const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("ID không hợp lệ");
};

// Thêm sản phẩm vào Flash Sale
export const addProductToFlashSale = async (data) => {
  const { flashSaleId, productVariantId, flash_price, stock } = data;

  const variant = await ProductVariant.findById(productVariantId);
  if (!variant) throw new Error("Biến thể sản phẩm không tồn tại");

  const newItem = await FlashSaleItem.create({
    flashSaleId,
    productVariantId,
    productId: variant.productId,
    flash_price: Number(flash_price),
    stock: Number(stock),
  });

  return newItem;
};

// Lấy danh sách sản phẩm với thông tin chi tiết
export const getFlashSaleItems = async (flashSaleId) => {
  // Ép kiểu chuỗi sang ObjectId của MongoDB
  const objectId = new mongoose.Types.ObjectId(flashSaleId);
  
  const items = await FlashSaleItem.find({ flashSaleId: objectId })
    .populate("productVariantId", "name sku price")
    .populate("productId", "name image");
    
    console.log("Flash Sale Items:", items); // Debug log để kiểm tra dữ liệu trả về
  return items;
};


/**
 * Logic Mua Hàng Chuẩn Production (Sử dụng Transaction của MongoDB)
 * Lưu ý: Khi lên production thực thụ, bạn nên thay thế logic này bằng Redis Lua Script
 */
export const purchaseItem = async (flashSaleItemId, quantity = 1) => {
  // 1. Kiểm tra ID hợp lệ
  validateId(flashSaleItemId);

  // 2. Thực hiện update nguyên tử (Atomic Update)
  // Điều kiện { stock: { $gte: quantity } } đảm bảo chỉ trừ kho 
  // nếu số lượng hiện tại đủ đáp ứng yêu cầu.
  const updatedItem = await FlashSaleItem.findOneAndUpdate(
    { 
      _id: flashSaleItemId, 
      stock: { $gte: quantity } 
    },
    { 
      $inc: { 
        stock: -quantity, 
        sold_count: quantity 
      } 
    },
    { new: true } // Trả về bản ghi sau khi đã cập nhật
  );

  // 3. Nếu updatedItem trả về null, nghĩa là hoặc ID sai, 
  // hoặc điều kiện stock >= quantity không thỏa mãn (đã hết hàng)
  if (!updatedItem) {
    // Để biết chính xác lỗi do không tìm thấy hay do hết hàng, ta kiểm tra lại
    const item = await FlashSaleItem.findById(flashSaleItemId);
    if (!item) {
      throw new Error("Sản phẩm không tồn tại");
    } else {
      throw new Error("Sản phẩm đã hết hàng hoặc không đủ số lượng");
    }
  }

  return { success: true, data: updatedItem };
};