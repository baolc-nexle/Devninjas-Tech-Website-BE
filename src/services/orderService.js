import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import ProductVariant from "../models/ProductVariant.js";
import OrderDetail from "../models/OrderDetail.js";
import * as stockService from "../services/stockService.js";
import mongoose from "mongoose";

export const createOrderFromCart = async (userId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    throw new Error("Giỏ hàng trống");
  }

  // 1. validate stock
  await stockService.validateCartStock(cart.items);

  // 2. lấy tất cả variant 1 lần (OPTIMIZE)
  const variantIds = cart.items.map((i) => i.variantId);

  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
  });

  const variantMap = new Map();
  variants.forEach((v) => {
    variantMap.set(v._id.toString(), v);
  });

  let subTotal = 0;
  const orderItems = [];

  // 3. build order + reserve stock
  for (const item of cart.items) {
    const variant = variantMap.get(item.variantId.toString());

    if (!variant) {
      throw new Error("Variant không tồn tại");
    }

    await stockService.reserveStock(item.variantId, item.quantity);

    subTotal += item.price * item.quantity;

    orderItems.push({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      image: item.image,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
    });
  }

  const orderCode = "ORD-" + Date.now();

  // 4. create order
  const order = await Order.create({
    userId,
    subTotal,
    discount: 0,
    totalPrice: subTotal,
    status: "pending",
    paymentStatus: "unpaid",
    orderCode,
  });

  // 5. tạo orderDetail
  const orderDetails = orderItems.map((item) => ({
    orderId: order._id,
    ...item,
  }));

  // thêm vào orderDetail
  await OrderDetail.insertMany(orderDetails);

  // 6. clear cart
  cart.items = [];
  await cart.save();

  return order;
};

export const updateOrderStatus = async (orderId, newStatus) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("OrderId không hợp lệ");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Đơn hàng không hợp lệ");

  const items = await OrderDetail.find({ orderId });

  const currentStatus = order.status;

  const allowedStatuses = [
    "pending",
    "processing",
    "shipping",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("Trạng thái không hợp lệ");
  }

  if (currentStatus === "delivered") {
    throw new Error("Đơn đã hoàn thành");
  }

  const validTransitions = {
    pending: ["processing", "cancelled"],
    processing: ["shipping"],
    shipping: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new Error(`Không thể chuyển từ ${currentStatus} → ${newStatus}`);
  }

  // cancel vẫn giữ
  if (currentStatus !== "cancelled" && newStatus === "cancelled") {
    for (const item of items) {
      await stockService.releaseStock(item.variantId, item.quantity);
    }
  }

  order.status = newStatus;
  await order.save();

  return order;
};

export const cancelOrder = async (userId, orderId) => {
  // 1. validate id
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("orderId không hợp lệ");
  }

  const order = await Order.findById(orderId);

  if (!order) throw new Error("Không tồn tại");

  // check quyền
  if (!order.userId.equals(userId)) {
    throw new Error("Không có quyền");
  }

  // 3. không cho huỷ nếu đã huỷ
  if (order.status === "cancelled") {
    throw new Error("Đơn đã bị huỷ");
  }

  // 4. không cho hủy đơn khi đang giao hoặc giao thành công
  if (!["pending", "paid"].includes(order.status)) {
    throw new Error("Không thể huỷ đơn ở trạng thái này");
  }

  return await updateOrderStatus(orderId, "cancelled");
};

export const getOrdersByUser = async (userId, query) => {
  const { page = 1, limit = 10, status, sort = "desc" } = query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("userId không hợp lệ");
  }

  const skip = (page - 1) * limit;

  const match = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (status) {
    match.status = status;
  }

  const sortOption = {
    createdAt: sort === "asc" ? 1 : -1,
  };

  const orders = await Order.aggregate([
    // 🔥 filter
    { $match: match },

    // 🔥 sort
    { $sort: sortOption },

    // 🔥 pagination
    { $skip: skip },
    { $limit: Number(limit) },

    // 🔥 JOIN OrderDetail
    {
      $lookup: {
        from: "orderdetails", // tên collection (lowercase + plural)
        localField: "_id",
        foreignField: "orderId",
        as: "items",
      },
    },
  ]);

  // 🔥 total count riêng
  const total = await Order.countDocuments(match);

  return {
    data: orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrderById = async (userId, orderId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("UserId không hợp lệ");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("OrderId không hợp lệ");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  if (!order.userId.equals(userId)) {
    throw new Error("Không có quyền truy cập đơn hàng này");
  }

  const items = await OrderDetail.find({ orderId });

  return {
    id: order._id,
    userId: order.userId,
    totalPrice: order.totalPrice,
    status: order.status,
    items: items || [],
  };
};

export const getAllOrders = async (query) => {
  const { page = 1, limit = 10, status, sort = "desc", search, userId } = query;

  const skip = (page - 1) * limit;

  const match = {};

  // filter status
  if (status) {
    match.status = status;
  }

  // filter userId
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match.userId = new mongoose.Types.ObjectId(userId);
  }

  // search theo orderId
  if (search && mongoose.Types.ObjectId.isValid(search)) {
    match._id = new mongoose.Types.ObjectId(search);
  }

  const sortOption = {
    createdAt: sort === "asc" ? 1 : -1,
  };

  const orders = await Order.aggregate([
    { $match: match },
    { $sort: sortOption },
    { $skip: skip },
    { $limit: Number(limit) },

    // join items
    {
      $lookup: {
        from: "orderdetails",
        localField: "_id",
        foreignField: "orderId",
        as: "items",
      },
    },
  ]);

  const total = await Order.countDocuments(match);

  return {
    data: orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};
