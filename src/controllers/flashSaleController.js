import * as FlashSaleService from "../services/flashSaleService.js";

export const getAllFlashSales = async (req, res) => {
  try {
    const flashSales = await FlashSaleService.getAllFlashSales();
    return res.status(200).json({
      success: true,
      message: "Get all flash sales successfully",
      data: flashSales,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createFlashSale = async (req, res) => {
  try {
    const newFlashSale = await FlashSaleService.createFlashSale(req.body);
    return res.status(201).json({
      success: true,
      message: "Create flash sale successfully",
      data: newFlashSale,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getFlashSalesByDate = async (req, res) => {
  try {
    const { date } = req.query; // Nhận ngày từ query param: /api/flash-sales/by-date?date=2026-06-22
    const flashSales = await FlashSaleService.getFlashSalesByDate(date);
    
    return res.status(200).json({
      success: true,
      data: flashSales,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};