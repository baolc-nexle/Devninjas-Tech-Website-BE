import Rating from "../models/Rating.js";
import OrderDetail from "../models/OrderDetail.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

// Hàm kiểm tra ID hợp lệ theo chuẩn code mẫu của bạn
const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("ID không hợp lệ");
};


/**
 * 1. Tạo đánh giá mới
 */
export const createRating = async (userId, data) => {
  const { orderDetailId, overallRating, detailedRatings, comment, images } = data;

  // Kiểm tra tính hợp lệ của orderDetailId
  validateId(orderDetailId);

  // Bước 1: Kiểm tra xem orderDetailId có tồn tại không
  const orderDetail = await OrderDetail.findById(orderDetailId);
  if (!orderDetail) {
    throw new Error("Chi tiết đơn hàng không tồn tại");
  }

  // Bước 2: Kiểm tra đơn hàng có thuộc về user đang thực hiện hay không
  const order = await Order.findById(orderDetail.orderId);
  if (!order || order.userId.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền đánh giá sản phẩm này");
  }

  // Bước 3: Kiểm tra trạng thái đơn hàng (ví dụ: phải hoàn thành/đã giao mới được đánh giá)
  if (order.status !== "delivered") {
    throw new Error("Chỉ có thể đánh giá sau khi đơn hàng đã được giao thành công");
  }

  // Bước 4: Kiểm tra xem chi tiết đơn hàng này đã được đánh giá trước đó chưa
  const existingRating = await Rating.findOne({ orderDetailId });
  if (existingRating) {
    throw new Error("Bạn đã đánh giá sản phẩm này rồi");
  }

  // Tiến hành tạo mới đánh giá
  const newRating = await Rating.create({
    orderDetailId,
    overallRating,
    detailedRatings,
    comment,
    images: images || [],
  });

  return newRating;
};

/**
 * 2. Lấy danh sách đánh giá theo sản phẩm (hỗ trợ phân trang và lọc theo số sao)
 */
export const getRatingsByProduct = async (productId, queryParams = {}) => {
  validateId(productId);

  const { page = 1, limit = 10, star } = queryParams;

  // Tìm tất cả các orderDetail liên quan đến productId gốc của sản phẩm
  const orderDetails = await OrderDetail.find({ productId }).select("_id");
  const orderDetailIds = orderDetails.map((item) => item._id);

  // Tạo điều kiện lọc
  const filter = { 
    orderDetailId: { $in: orderDetailIds }, 
    isApproved: true 
  };
  
  if (star) {
    filter.overallRating = Number(star);
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Truy vấn lấy danh sách đánh giá kèm populate ngược để lấy thông tin user
  const ratings = await Rating.find(filter)
    .populate({
      path: "orderDetailId",
      select: "orderId",
      populate: {
        path: "orderId",
        select: "userId",
        populate: {
          path: "userId",
          select: "name avatar", // Lấy tên và avatar của người dùng
        },
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Rating.countDocuments(filter);

  return {
    ratings,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};
