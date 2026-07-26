import Inventory from "../models/Inventories.js";
import ProductVariant from "../models/ProductVariant.js";

// 1. Kiểm tra tồn kho khả dụng
export const checkAvailableStock = async (variantId, quantity) => {
  const variant = await ProductVariant.findById(variantId);
  const inventory = await Inventory.findOne({ variantId });
  
  if (!variant || !inventory) throw new Error("Không tìm thấy sản phẩm hoặc kho");

  const available = variant.stock - inventory.reservedStock;
  
  if (available < quantity) {
    throw new Error(`Không đủ hàng cho ${variant.sku}. Chỉ còn ${available} cái.`);
  }
  return true;
};

// 2. Reserve Stock (Dùng điều kiện để đảm bảo không vượt quá hàng khả dụng)
export const reserveStock = async (variantId, quantity) => {
  // 1. Dùng { new: true, upsert: true } để tự động tạo mới nếu chưa tồn tại
  // $inc sẽ hoạt động chính xác ngay cả với bản ghi mới được tạo
  const result = await Inventory.findOneAndUpdate(
    { variantId },
    { $inc: { reservedStock: quantity } },
    { new: true, upsert: true }
  );

  if (!result) {
    throw new Error("Không thể cập nhật kho");
  }
  
  // 2. Kiểm tra thực tế: Hàng khả dụng (Tổng - Đang giữ) phải >= 0
  const variant = await ProductVariant.findById(variantId);
  
  // Nếu tổng stock nhỏ hơn số lượng đã reserve -> vượt quá hàng cho phép
  if (variant.stock < result.reservedStock) {
    // Rollback bằng cách trừ ngược lại số đã tăng
    await Inventory.updateOne(
      { variantId }, 
      { $inc: { reservedStock: -quantity } }
    );
    throw new Error(`Không đủ hàng để giữ. Hiện còn: ${variant.stock - (result.reservedStock - quantity)}`);
  }

  return result;
};

// 3. Confirm Stock (Thực hiện tuần tự 2 lệnh update trực tiếp)
export const confirmStock = async (variantId, quantity) => {
  // Trừ tổng stock
  await ProductVariant.updateOne({ _id: variantId }, { $inc: { stock: -quantity } });

  // Giảm reservedStock và tăng soldCount
  const result = await Inventory.updateOne(
    { variantId },
    { $inc: { reservedStock: -quantity, soldCount: quantity } }
  );

  if (result.matchedCount === 0) throw new Error("Cập nhật kho thất bại");
};

// 4. Release Stock (Hoàn kho)
export const releaseStock = async (variantId, quantity) => {
  await Inventory.updateOne(
    { variantId },
    { $inc: { reservedStock: -quantity } }
  );
};