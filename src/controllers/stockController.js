import * as stockService from "../services/stockService.js";

export const checkStock = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    await stockService.checkStock(variantId, quantity);

    res.status(200).json({
      success: true,
      message: "Còn đủ hàng",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const reserveStock = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    const variant = await stockService.reserveStock(variantId, quantity);

    res.status(200).json({
      success: true,
      message: "Đã giữ hàng thành công",
      data: variant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const releaseStock = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    const variant = await stockService.releaseStock(variantId, quantity);

    res.status(200).json({
      success: true,
      message: "Đã trả hàng thành công",
      data: variant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const decreaseStock = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    const variant = await stockService.decreaseStock(variantId, quantity);

    res.status(200).json({
      success: true,
      message: "Đã trừ kho thành công",
      data: variant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const increaseStock = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    const variant = await stockService.increaseStock(variantId, quantity);

    res.status(200).json({
      success: true,
      message: "Đã hoàn kho thành công",
      data: variant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const validateCartStock = async (req, res) => {
  try {
    const { items } = req.body;

    await stockService.validateCartStock(items);

    res.status(200).json({
      success: true,
      message: "Giỏ hàng hợp lệ, đủ tồn kho",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
