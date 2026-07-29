import * as orderService from "../services/orderService.js";
import * as paymentService from "../services/paymentService.js";

export const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod } = req.body; // Lấy phương thức thanh toán từ FE

    // 1. Tạo đơn hàng thông qua service (Service của bạn đã xử lý lưu DB)
    const order = await orderService.createOrderFromCart(userId, req.body);

    // 2. Xử lý thanh toán dựa trên phương thức
    if (paymentMethod === "stripe") {
      // Gọi service tạo Stripe Session (Bạn cần viết service này)
      const sessionUrl = await paymentService.createStripeCheckoutSession(order._id);
      
      return res.status(201).json({
        success: true,
        message: "Đơn hàng đã tạo, đang chuyển hướng thanh toán Stripe",
        data: order,
        url: sessionUrl, // Trả URL về cho FE chuyển hướng
      });
    }

    // 3. Nếu là COD
    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công với phương thức COD",
      data: order,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    // 1. Lấy cả status và cancellation_reason từ req.body gửi lên từ frontend
    const { status, cancellation_reason } = req.body; 

    console.log("DEBUG TRƯỚC KHI GỌI HÀM:");
    console.log("ID:", orderId);
    console.log("Status:", status); 
    console.log("Cancellation Reason:", cancellation_reason); 

    // 2. Truyền thêm cancellation_reason vào tham số thứ 3 (reason) của service
    const order = await orderService.updateOrderStatus(orderId, status, cancellation_reason);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body; // Lấy lý do từ phía người dùng gửi lên

    const order = await orderService.cancelOrder(userId, orderId, reason);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await orderService.getOrdersByUser(userId, req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await orderService.getOrderById(userId, orderId);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updatedOrder = await orderService.updateOrder(orderId, req.body);
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


