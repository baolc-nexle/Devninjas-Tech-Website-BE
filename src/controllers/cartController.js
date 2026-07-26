import * as cartService from "../services/cartService.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy thêm productId từ req.body (nếu Frontend có gửi lên)
    const { variantId, productId, quantity } = req.body;

    // Nếu Frontend không gửi productId, ta truyền null để service tự xử lý
    const cart = await cartService.addToCart(userId, variantId, quantity, productId);
    
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
    
    // Nếu service không trả về gì, trả về giỏ hàng trống thay vì lỗi
    res.status(200).json({
      success: true,
      message: "Lấy giỏ hàng thành công",
      data: cart || { items: [] }, 
    });
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error);
    // Thay 404 bằng 500 (Lỗi server) để phân biệt với lỗi "Không tìm thấy"
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Lỗi máy chủ nội bộ" 
    });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params; // Lấy từ URL
    const { quantity } = req.body;    // Lấy từ Body

    // Kiểm tra xem quantity có hợp lệ không
    if (quantity === undefined || quantity < 1) {
       return res.status(400).json({ success: false, message: "Số lượng không hợp lệ" });
    }

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

export const updateCartVariant = async (req, res) => {
  try {
    console.log("DEBUG: req.user là:", req.user);
    const userId = req.user.id; // Giả sử bạn đã có middleware xác thực user
    const { oldVariantId, newVariantId } = req.body;

    const result = await cartService.updateCartVariant(userId, oldVariantId, newVariantId);
    
    res.status(200).json({
      success: true,
      message: "Cập nhật biến thể thành công",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật biến thể"
    });
  }
};
