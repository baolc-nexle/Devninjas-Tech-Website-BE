import mongoose from "mongoose";
import Voucher from "../models/Voucher.js";
import Order from "../models/Order.js";
import VoucherUsage from "../models/VoucherUsage.js";

const validateId = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID không hợp lệ");
  }
};

export const createVoucher = async (data) => {
  const {
      code,
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      usageLimitPerUser,
      applyTo,
      usedCount,
      startDate,
      endDate,
      isActive,
  } = data;

  if (!code || !value || !type || !startDate || !endDate) {
    throw new Error("Không được phép để trống");
  }

  if (type === "percentage" && (value <= 0 || value > 100)) {
    throw new Error("giá trị phần không hợp lệ");
  }

  if (endDate <= startDate) {
    throw new Error("Không hợp lệ");
  }

  const existVoucher = await Voucher.findOne({
    code: code.toUpperCase().trim(),
  });

  if (existVoucher) {
    throw new Error("Mã voucher đã tồn tại");
  }

  const voucher = await Voucher.create({
      code: code.toUpperCase().trim(),
      name,
      description,
      type,
      value,
      minOrderValue: minOrderValue || 0,
      maxDiscount,
      usageLimit: usageLimit || 0,
      usageLimitPerUser,
      applyTo,
      usedCount,
      startDate,
      endDate,
      isActive,
  });

  return voucher;
};

export const validateVoucher = async (voucherCode, orderId, userId) => {
  validateId(orderId);

  validateId(userId);

  const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });

  if (!voucher) {
    throw new Error("Voucher không tồn tại");
  }

  // --- THÊM VÀO ĐÂY ---
  const usedCount = await VoucherUsage.countDocuments({
      voucherId: voucher._id,
      userId,
  });

  if (
      voucher.usageLimitPerUser > 0 &&
      usedCount >= voucher.usageLimitPerUser
  ) {
      throw new Error("Bạn đã sử dụng hết số lượt của voucher này");
  }

  // 2. Các kiểm tra cơ bản về trạng thái voucher
  if (!voucher.isActive) {
    throw new Error("Voucher hiện không hoạt động");
  }

  const nowDate = new Date();

  if (voucher.startDate > nowDate) {
    throw new Error("Voucher chưa có hiệu lực");
  }

  if (voucher.endDate < nowDate) {
    throw new Error("Voucher đã hết hạn");
  }

  if (voucher.usageLimit !== 0 && voucher.usedCount >= voucher.usageLimit) {
    throw new Error("Đã hết lượt sử dụng voucher");
  }

  const order = await Order.findById(orderId);

  if (order.status !== "pending") {
    throw new Error("Chỉ áp dụng voucher cho đơn chưa thanh toán");
  }

  if (order.totalPrice < voucher.minOrderValue) {
    // SỬA LỖI LOGIC: Nếu tổng tiền nhỏ hơn mức tối thiểu thì mới lỗi
    throw new Error(
      `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString()}đ để dùng voucher này`,
    );
  }

  return voucher;
};

export const applyVoucher = async (voucherCode, orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  if (order.status !== "pending") {
    throw new Error("Chỉ áp dụng voucher cho đơn chưa thanh toán");
  }

  if (order.voucherId) {
    throw new Error("Đơn hàng này đã được áp dụng voucher rồi");
  }

  const voucher = await validateVoucher(voucherCode, orderId, userId);

  const basePrice = order.subtotal;

  let discount = 0;

  if (voucher.type === "percentage") {
    discount = (basePrice * voucher.value) / 100;

    if (voucher.maxDiscount) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
  }

  if (voucher.type === "fixed") {
    discount = voucher.value;
  }

  // không cho tiền âm
  discount = Math.min(discount, basePrice);

  await reserveVoucher(voucher._id);
    // Lưu lịch sử user đã dùng voucher
  await VoucherUsage.create({
    voucherId: voucher._id,
    userId,
    orderId,
    usedAt: new Date(),
  });
  // update order
  order.voucherId = voucher._id;
  order.discount = discount;
  order.totalPrice = basePrice - discount;

  await order.save();

  return {
    discount,
    finalPrice: order.totalPrice,
  };
};

export const reverseVoucher = async (voucherId, orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("order không tồn tại");
  }

  if (!order.voucherId || order.voucherId.toString() !== voucherId.toString()) {
    throw new Error("Order không sử dụng voucher này");
  }

  if (order.status === "paid") {
    throw new Error("Đơn hàng đã thanh toán, không thể rollback voucher");
  }

  const existVoucher = await Voucher.findById(voucherId);

  if (!existVoucher) {
    throw new Error("voucher không tồn tại");
  }

  // rollback
  const result = await Voucher.updateOne(
    {
      _id: voucherId,
      usedCount: { $gt: 0 }, // gt là lớn hơn
    },
    {
      $inc: { usedCount: -1 }, // inc (increment) tăng giảm
    },
  );

  if (result.modifiedCount === 0) {
    throw new Error("Không thể rollback voucher");
  }

  //reset order
  order.voucherId = null;
  order.discount = 0;
  order.totalPrice = order.subtotal;

  await order.save();

  return { message: "Rollback voucher thành công" };
};

export const reserveVoucher = async (voucherId) => {
  const result = await Voucher.updateOne(
    {
      _id: voucherId,
      $or: [
        { usageLimit: 0 },
        {
          $expr: {
            $lt: ["$usedCount", "$usageLimit"],
          },
        },
      ],
    },
    {
      $inc: { usedCount: 1 },
    },
  );

  if (result.modifiedCount === 0) {
    throw new Error("Voucher đã hết lượt sử dụng");
  }
};

export const finalizeVoucher = async (voucherId, orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Đơn hàng không tồn tại");
  }

  if (order.status !== "paid") {
    throw new Error("Chỉ finalize khi thanh toán thành công");
  }

  await VoucherUsage.create({
    voucherId,
    userId,
    orderId,
    usedAt: new Date(),
  });

  return { message: "Voucher đã được sử dụng" };
};

export const getAvailableVouchers = async (orderValue) => {
  const now = new Date();
  
  // Lấy các voucher còn hạn, còn lượt, và thỏa mãn minOrderValue
  const vouchers = await Voucher.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: 0 },
      { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
    ],
    minOrderValue: { $lte: orderValue || 0 }
  }).sort({ createdAt: -1 }); // Lấy mới nhất lên trước

  return vouchers;
};

export const getAllVouchers = async () => {
    return await Voucher.find().sort({ createdAt: -1 });
};

export const updateVoucher = async (id, data) => {
    return await Voucher.findByIdAndUpdate(id, data, {
        new: true,
    });
};

export const deleteVoucher = async (id) => {
    return await Voucher.findByIdAndDelete(id);
};
