import Address from "../models/Address.js";
import User from "../models/User.js"; // Nhớ import model User vào đây

// 1. Lấy danh sách địa chỉ của user (có hỗ trợ phân trang & tìm kiếm theo tên/tỉnh thành)
export const getAddressesByUserService = async (userId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = query.search || "";

  // Điều kiện lọc theo userId và từ khóa tìm kiếm (tên người nhận, tỉnh thành hoặc địa chỉ chi tiết)
  const filter = {
    userId,
    ...(search && {
      $or: [
        { fullname: { $regex: search, $options: 'i' } },
        { province: { $regex: search, $options: 'i' } },
        { detail: { $regex: search, $options: 'i' } },
      ],
    }),
  };

  const total = await Address.countDocuments(filter);
  const addresses = await Address.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ isDefault: -1, createdAt: -1 }); // Ưu tiên hiển thị địa chỉ mặc định lên đầu, sau đó theo thời gian mới nhất

  return {
    data: addresses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 2. Thêm địa chỉ mới
export const createAddressService = async (userId, addressData) => {
  // 1. Truy vấn thông tin user đang đăng nhập từ database để lấy name và phone
  const currentUser = await User.findById(userId);
  if (!currentUser) {
    throw new Error("Không tìm thấy người dùng");
  }

  // 2. Lấy các trường thông tin địa chỉ từ form gửi lên
  const { province, district, ward, detail, addressName, addressType, isDefault } = addressData;

  // 3. Tự động gán fullname và phone từ tài khoản User
  const fullname = currentUser.name;
  const phone = currentUser.phone || ""; // Nếu user chưa cập nhật sđt thì để chuỗi trống

  // Kiểm tra xem user đã có địa chỉ nào chưa. Nếu chưa có cái nào thì bắt buộc địa chỉ này là mặc định
  const countUserAddresses = await Address.countDocuments({ userId });
  let shouldBeDefault = isDefault;
  if (countUserAddresses === 0) {
    shouldBeDefault = true;
  }

  // Nếu địa chỉ mới được chọn là mặc định, reset các địa chỉ cũ của user này về false
  if (shouldBeDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  const newAddress = await Address.create({
    userId,
    fullname, // Đã lấy tự động từ User
    phone,    // Đã lấy tự động từ User
    province,
    district,
    ward,
    detail,
    addressName,
    addressType,
    isDefault: shouldBeDefault,
  });

  return newAddress;
};

// 3. Cập nhật địa chỉ
export const updateAddressService = async (userId, addressId, updateData) => {
  const { fullname, phone, province, district, ward, detail, addressName, addressType, isDefault } = updateData;

  // Kiểm tra xem địa chỉ có thuộc về user này không
  const existingAddress = await Address.findOne({ _id: addressId, userId });
  if (!existingAddress) {
    throw new Error("Không tìm thấy địa chỉ hoặc bạn không có quyền chỉnh sửa");
  }

  // Nếu set địa chỉ này thành mặc định, update các địa chỉ khác về false
  if (isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    {
      $set: {
        ...(fullname !== undefined && { fullname }),
        ...(phone !== undefined && { phone }),
        ...(province !== undefined && { province }),
        ...(district !== undefined && { district }),
        ...(ward !== undefined && { ward }),
        ...(detail !== undefined && { detail }),
        ...(addressName !== undefined && { addressName }),
        ...(addressType !== undefined && { addressType }),
        ...(isDefault !== undefined && { isDefault }),
      },
    },
    { new: true, runValidators: true }
  );

  return updatedAddress;
};

// 4. Xóa địa chỉ
export const deleteAddressService = async (userId, addressId) => {
  const addressToDelete = await Address.findOne({ _id: addressId, userId });
  if (!addressToDelete) {
    throw new Error("Không tìm thấy địa chỉ hoặc bạn không có quyền xóa");
  }

  await Address.findByIdAndDelete(addressId);

  // Nếu địa chỉ bị xóa là địa chỉ mặc định, tự động chọn địa chỉ đầu tiên còn lại làm mặc định mới
  if (addressToDelete.isDefault) {
    const remainingAddress = await Address.findOne({ userId });
    if (remainingAddress) {
      remainingAddress.isDefault = true;
      await remainingAddress.save();
    }
  }

  return { message: "Đã xóa địa chỉ thành công" };
};