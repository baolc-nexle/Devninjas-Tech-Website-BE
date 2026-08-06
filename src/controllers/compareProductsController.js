import { compareProductsService } from '../services/compareProductsService.js';

export const handleCompareProducts = async (req, res) => {
  try {
    const { productIds, userNeed } = req.body;
    
    // Gọi service xử lý
    const result = await compareProductsService(productIds, userNeed);

    return res.status(200).json({
      success: true,
      message: "So sánh sản phẩm thành công",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};