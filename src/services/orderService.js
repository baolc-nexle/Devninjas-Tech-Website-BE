import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import ProductVariant from "../models/ProductVariant.js";
import Product from "../models/Product.js";
import OrderDetail from "../models/OrderDetail.js";
import * as stockService from "../services/stockService.js";
import * as inventoryService from "../services/inventoryService.js";
import { sendCancelOrderEmail } from "../utils/sendEmail.js";
import mongoose from "mongoose";




// done
// new
// export const createOrderFromCart = async (userId, orderData) => {
//   const { receiverName, receiverPhone, receiverEmail, province, ward, address, paymentMethod } = orderData;
  
//   // 1. Lấy giỏ hàng (Không cần session)
//   const cartItems = await Cart.find({ userId }).populate("variantId");
//   if (!cartItems.length) throw new Error("Giỏ hàng trống");

//   // 2. Validate (Dùng service mới)
//   await stockService.validateCartStock(cartItems);

//   let subTotal = 0;
//   const orderItems = [];

//   // 3. Reserve stock & Build orderItems
//   for (const item of cartItems) {
//     const variant = item.variantId;
    
//     // GỌI SERVICE MỚI (không truyền session)
//     // Lưu ý: inventoryService.reserveStock giờ đây dùng Atomic Update
//     await inventoryService.reserveStock(variant._id, item.quantity);

//     subTotal += variant.price * item.quantity;
//     orderItems.push({
//       productId: variant.productId,
//       variantId: variant._id,
//       name: variant.productId.name,
//       image: variant.image,
//       sku: variant.sku,
//       price: variant.price,
//       quantity: item.quantity,
//     });
//   }

//   // 4. Tạo Order
//   const order = await Order.create({
//     userId,
//     receiverName, receiverPhone, receiverEmail,
//     province, ward, address,
//     subtotal: subTotal,
//     totalPrice: subTotal,
//     paymentMethod: paymentMethod || "cod",
//     status: "pending",
//     paymentStatus: "unpaid",
//     orderCode: "ORD-" + Date.now(),
//   });

//   // 5. Tạo OrderDetail
//   const orderDetails = orderItems.map((item) => ({ ...item, orderId: order._id }));
//   await OrderDetail.insertMany(orderDetails);

//   // 6. Xóa giỏ hàng
//   await Cart.deleteMany({ userId });

//   return order;
// };

export const createOrderFromCart = async (userId, orderData) => {
  const { receiverName, receiverPhone, receiverEmail, province, ward, address, paymentMethod, voucherId } = orderData;
  
  // 1. Lấy giỏ hàng và populate SÂU để lấy tên sản phẩm
  const cartItems = await Cart.find({ userId }).populate({
    path: "variantId",
    populate: { path: "productId", select: "name" }
  });

  if (!cartItems.length) throw new Error("Giỏ hàng trống");

  // 2. Validate tồn kho
  await stockService.validateCartStock(cartItems);

  let subTotal = 0;
  const orderItems = [];

  // 3. Reserve stock & Build orderItems
  for (const item of cartItems) {
    const variant = item.variantId;
    
    // Reserve stock từng item
    await inventoryService.reserveStock(variant._id, item.quantity);

    subTotal += variant.price * item.quantity;
    
    // Đảm bảo lấy đúng name từ productId đã populate
    orderItems.push({
      productId: variant.productId._id,
      variantId: variant._id,
      name: variant.productId?.name || "Sản phẩm chưa cập nhật tên",
      image: variant.image,
      sku: variant.sku,
      price: variant.price,
      quantity: item.quantity,
    });
  }

  // BƯỚC 4: Tạo Order (KHÔNG CẦN TÍNH TOÁN, CHỈ GÁN VÀO)
  // Nếu bạn vẫn muốn Backend kiểm tra nhanh một lần nữa:
  let discount = 0;
  if (voucherId) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) throw new Error("Mã không tồn tại");
    // Lấy lại logic tính tiền từ Voucher
    discount = voucher.type === 'percentage' ? (subTotal * voucher.value / 100) : voucher.value;
  }

  // 4. Tạo Order
  const order = await Order.create({
    userId,
    receiverName, receiverPhone, receiverEmail,
    province, ward, address,
    subtotal: subTotal,
    totalPrice: subTotal,
    paymentMethod: paymentMethod || "cod",
    status: "pending",
    paymentStatus: "unpaid",
    voucherId: voucherId || null,
    discount: discount,
    orderCode: "ORD-" + Date.now(),
  });

  // 5. Tạo OrderDetail
  const orderDetails = orderItems.map((item) => ({ 
    ...item, 
    orderId: order._id 
  }));
  await OrderDetail.insertMany(orderDetails);

  // 6. Xóa giỏ hàng
  // await Cart.deleteMany({ userId });

  return {
    ...order.toObject(),
    orderId: order._id 
  };
};

// old
// export const updateOrderStatus = async (orderId, newStatus, reason = null) => {
//   if (!mongoose.Types.ObjectId.isValid(orderId)) {
//     throw new Error("OrderId không hợp lệ");
//   }

//   const order = await Order.findById(orderId);
//   if (!order) throw new Error("Đơn hàng không hợp lệ");

//   const items = await OrderDetail.find({ orderId });

//   const currentStatus = order.status;

//   const allowedStatuses = [
//     "pending",
//     "processing",
//     "shipping",
//     "delivered",
//     "cancelled",
//   ];

//   if (!allowedStatuses.includes(newStatus)) {
//     throw new Error("Trạng thái không hợp lệ");
//   }

//   if (currentStatus === "delivered") {
//     throw new Error("Đơn đã hoàn thành");
//   }

//   const validTransitions = {
//     pending: ["processing", "cancelled"],
//     processing: ["shipping"],
//     shipping: ["delivered"],
//     delivered: [],
//     cancelled: [],
//   };

//   if (!validTransitions[currentStatus].includes(newStatus)) {
//     throw new Error(`Không thể chuyển từ ${currentStatus} → ${newStatus}`);
//   }

//   // cancel vẫn giữ
//   if (currentStatus !== "cancelled" && newStatus === "cancelled") {
//     for (const item of items) {
//       await stockService.releaseStock(item.variantId, item.quantity);
//     }

//     // Gán lý do hủy vào đây
//     order.cancelReason = reason;
//   }

//   // TỐI ƯU: Nếu đơn chuyển sang 'delivered', bạn có muốn gọi confirmStock 
//   // để trừ kho thật sự không? (Hiện tại bạn mới chỉ reserve)
//   if (newStatus === "delivered" && currentStatus === "shipping") {
//      for (const item of items) {
//        await stockService.confirmStock(item.variantId, item.quantity);
//      }
//   }

//   order.status = newStatus;
//   await order.save();

//   return order;
// };

export const updateOrderStatus = async (orderId, newStatus, reason = null) => {
  // THỬ CƯỠNG BỨC GÁN GIÁ TRỊ TẠM THỜI ĐỂ TEST
  console.log("DEBUG: Giá trị newStatus nhận được là:", newStatus);

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    console.error("DEBUG: Invalid ObjectId format:", orderId);
    throw new Error("OrderId không hợp lệ");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    console.error("DEBUG: Order not found in DB:", orderId);
    throw new Error("Đơn hàng không hợp lệ");
  }

  const items = await OrderDetail.find({ orderId });
  const currentStatus = order.status;
  console.log("DEBUG: Current Status in DB:", currentStatus);

  const allowedStatuses = [
    "pending",
    "processing",
    "shipping",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(newStatus)) {
    console.warn("DEBUG: Status not in allowed list:", newStatus);
    throw new Error("Trạng thái không hợp lệ");
  }

  if (currentStatus === "delivered") {
    console.warn("DEBUG: Attempted to update a delivered order");
    throw new Error("Đơn đã hoàn thành");
  }

const validTransitions = {
  pending: ["processing", "cancelled"],
  processing: ["shipping", "cancelled"],
  shipping: ["delivered"],
  delivered: [], // Trạng thái cuối, không thể chuyển tiếp
  cancelled: []  // Trạng thái cuối, không thể chuyển tiếp
};

  // Debug kiểm tra cấu trúc transition
  if (!validTransitions[currentStatus]) {
    console.error(`DEBUG: currentStatus '${currentStatus}' does not exist in validTransitions!`);
    throw new Error(`Trạng thái hiện tại '${currentStatus}' không xác định.`);
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    console.warn(`DEBUG: Invalid transition: ${currentStatus} -> ${newStatus}`);
    throw new Error(`Không thể chuyển từ ${currentStatus} → ${newStatus}`);
  }

  // Logic Hủy đơn
  if (currentStatus !== "cancelled" && newStatus === "cancelled") {
    console.log("DEBUG: Processing Cancellation - Releasing stock...");
    for (const item of items) {
      await inventoryService.releaseStock(item.variantId, item.quantity);
    }
    
    // Gán lý do hủy (nếu không có thì lấy giá trị mặc định)
    order.cancelReason = reason || "Không có lý do cụ thể";

    // 📩 GỬI EMAIL THÔNG BÁO HỦY ĐƠN CHO KHÁCH HÀNG
    const customerEmail = order.receiverEmail; // Hoặc thuộc tính lưu email khách hàng trong DB của bạn
    if (customerEmail) {
      // Gọi bất đồng bộ (catch lỗi ngầm để không làm crash luồng chính nếu lỗi gửi mail)
      sendCancelOrderEmail(customerEmail, order.orderCode || order._id, order.cancelReason)
        .catch(err => console.error("Lỗi gửi mail hủy đơn:", err));
    }
  }

  // Logic xác nhận kho khi giao hàng thành công
  if (newStatus === "delivered" && currentStatus === "shipping") {
    console.log("DEBUG: Processing Delivery - Confirming stock...");
    // 1. Cập nhật trạng thái thanh toán thành 'paid'
    order.paymentStatus = "paid";
    for (const item of items) {
      await inventoryService.confirmStock(item.variantId, item.quantity);

      // Lưu ý: item.productId là trường bạn cần có trong OrderDetail
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { soldCount: item.quantity }
      });
    }
  }

  order.status = newStatus;
  await order.save();
  
  console.log("DEBUG: Update successful. New Status:", order.status);
  console.log("--- DEBUG END ---");
  
  return order;
};

export const cancelOrder = async (userId, orderId, reason) => {
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

  return await updateOrderStatus(orderId, "cancelled", reason);
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

// export const getOrderById = async (userId, orderId) => {
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     throw new Error("UserId không hợp lệ");
//   }

//   if (!mongoose.Types.ObjectId.isValid(orderId)) {
//     throw new Error("OrderId không hợp lệ");
//   }

//   const order = await Order.findById(orderId);

//   if (!order) {
//     throw new Error("Đơn hàng không tồn tại");
//   }

//   if (!order.userId.equals(userId)) {
//     throw new Error("Không có quyền truy cập đơn hàng này");
//   }

//   const items = await OrderDetail.find({ orderId });

//   return {
//     id: order._id,
//     userId: order.userId,
//     totalPrice: order.totalPrice,
//     status: order.status,
//     items: items || [],
//   };
// };

export const getOrderById = async (userId, orderId) => {
  // 1. Validate ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("UserId không hợp lệ");
  }

  // Hỗ trợ tìm kiếm bằng _id hoặc orderCode (phòng trường hợp frontend gửi orderCode lên URL)
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
  const query = isObjectId ? { _id: orderId } : { orderCode: orderId };

  // 2. Query thông tin Order
  const order = await Order.findOne(query);

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  // 3. Bảo mật: Kiểm tra chủ sở hữu đơn hàng
  if (!order.userId.equals(userId)) {
    throw new Error("Không có quyền truy cập đơn hàng này");
  }

  // 4. Lấy chi tiết sản phẩm (Lấy trực tiếp, không cần populate vì bạn đã lưu snapshot)
  const items = await OrderDetail.find({ orderId: order._id }).lean();

  // 5. Format lại phương thức thanh toán cho UI đẹp hơn
  const formatPaymentMethod = (method) => {
    switch (method) {
      case "cod": return "Thanh toán khi nhận hàng (COD)";
      case "stripe": return "Thanh toán qua thẻ (Stripe)";
      default: return method;
    }
  };

  // 6. Format ngày tháng chuẩn tiếng Việt (Giống giao diện tôi code lúc nãy)
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(date));
  };

  // 🔥 7. MAP DỮ LIỆU CHUẨN 100% VỚI FRONTEND UI NEXT.JS
  return {
    id: order.orderCode, // Trả về orderCode để UI hiển thị "Mã đơn hàng" cho chuyên nghiệp
    date: formatDate(order.createdAt),
    paymentMethod: formatPaymentMethod(order.paymentMethod),
    paymentStatus: order.paymentStatus, // 'unpaid' hoặc 'paid'
    status: order.status, 
    
    // Khớp thông tin nhận hàng
    customer: {
      name: order.receiverName,
      email: order.receiverEmail,
      phone: order.receiverPhone,
      // Nối 3 trường địa chỉ lại thành 1 chuỗi hoàn chỉnh cho UI
      address: `${order.address}, ${order.ward}, ${order.province}`,
    },

    // Khớp danh sách sản phẩm
    items: items.map(item => ({
      id: item.variantId || item._id, // Trả về ID dùng để làm key react
      name: item.name,                // Bạn đã lưu sẵn name cực tiện!
      image: item.image,              // UI hiện tại chưa hiển thị ảnh, nhưng có thể mở rộng sau
      price: item.price,
      quantity: item.quantity,
    })),

    // Khớp dữ liệu tài chính (rất rành mạch nhờ schema của bạn)
    subtotal: order.subtotal,
    shippingFee: 0, // Schema hiện chưa có phi vận chuyển, tôi để mặc định là 0
    discount: order.discount,
    total: order.totalPrice,
  };
};

export const getAllOrders = async (query) => {
  const { page = 1, limit = 10, status, sort = "desc", search, userId } = query;

  const skip = (page - 1) * limit;


  let match = {};

  // filter status
  if (status) {
    match.status = status.toLowerCase();
  }

  // filter userId
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match.userId = new mongoose.Types.ObjectId(userId);
  }

 // 3. Search linh hoạt bằng MongoDB Text Index
  // Chỉ nhận chuỗi từ FE, không nhận toán tử $
  if (search && search.trim() !== "") {
    const cleanSearch = search.trim();
    
    // Sử dụng Regex của JS để tạo pattern, không truyền từ URL
    const regex = new RegExp(cleanSearch, 'i');
    
    // Cách này an toàn tuyệt đối, không có $ nào ở URL
    match.$or = [
      { orderCode: { $regex: cleanSearch, $options: 'i' } },
      { receiverName: { $regex: cleanSearch, $options: 'i' } },
      { receiverPhone: { $regex: cleanSearch, $options: 'i' } },
      { receiverEmail: { $regex: cleanSearch, $options: 'i' } }
    ];

    // Chỉ kiểm tra ID nếu là 24 ký tự chuẩn
    if (/^[0-9a-fA-F]{24}$/.test(cleanSearch)) {
      match.$or.push({ _id: new mongoose.Types.ObjectId(cleanSearch) });
    }
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


export const updateOrder = async (orderId, updateData) => {
  // 1. Kiểm tra định dạng ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("OrderId không hợp lệ");
  }

  // 2. Tìm đơn hàng
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  // 3. Chỉ cho phép cập nhật nếu đơn hàng đang ở trạng thái 'draft' hoặc 'pending'
  // (Đảm bảo không cập nhật các đơn hàng đã hủy hoặc đã giao thành công)
  if (order.status !== 'draft' && order.status !== 'pending') {
    throw new Error("Không thể cập nhật đơn hàng ở trạng thái hiện tại");
  }

  // 4. Các trường được phép cập nhật
  const allowedUpdates = [
    'receiverName', 
    'receiverPhone', 
    'receiverEmail', 
    'province', 
    'ward', 
    'address', 
    'paymentMethod'
  ];

  // 5. Cập nhật dữ liệu
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      order[field] = updateData[field];
    }
  });

  // 6. Lưu vào DB
  await order.save();

  return order;
};
