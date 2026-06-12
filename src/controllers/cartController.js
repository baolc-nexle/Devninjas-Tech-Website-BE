import * as cartService from "../services/cartService.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId, quantity } = req.body;
    const cart = await cartService.addToCart(userId, variantId, quantity);
    res.status(200).json({
      success: true,
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.getCart(userId);
    res.status(200).json({
      success: true,
      message: "Lấy giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId, quantity } = req.body;
    const cart = await cartService.updateQuantity(userId, variantId, quantity);
    res.status(200).json({
      success: true,
      message: "Đã cập nhật số lượng trong giỏ hàng",
      data: cart,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;
    const cart = await cartService.deleteItem(variantId, userId);
    res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: cart,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.clearCart(userId);
    res.status(200).json({
      success: true,
      message: "Xóa toàn bộ giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};
