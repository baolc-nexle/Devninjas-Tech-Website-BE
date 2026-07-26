import * as FlashSaleItemService from "../services/flashSaleItemService.js";

// Thêm sản phẩm vào Flash Sale
export const addProductToFlashSale = async (req, res) => {
  try {
    const itemData = {
      flashSaleId: req.body.flashSaleId,
      productVariantId: req.body.productVariantId,
      flash_price: Number(req.body.flash_price),
      stock: Number(req.body.stock),
    };

    const newItem = await FlashSaleItemService.addProductToFlashSale(itemData);
    return res.status(201).json({
      success: true,
      message: "Add product to flash sale successfully",
      data: newItem,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy danh sách sản phẩm theo chiến dịch
export const getFlashSaleItems = async (req, res) => {
  try {
    const items = await FlashSaleItemService.getFlashSaleItems(req.params.flashSaleId);
    return res.status(200).json({
      success: true,
      message: "Get flash sale items successfully",
      data: items,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Mua hàng (Xử lý nghiệp vụ Flash Sale)
export const purchaseItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    await FlashSaleItemService.purchaseItem(itemId, quantity || 1);

    return res.status(200).json({
      success: true,
      message: "Purchase successfully",
    });
  } catch (error) {
    // Nếu lỗi là do hết hàng, trả về status 400 hoặc 409 (Conflict)
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};