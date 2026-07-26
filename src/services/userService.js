import User from "../models/User.js";

export const getAllUsersService = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = query.search || "";

  // Tìm kiếm theo name hoặc email, loại bỏ password khi trả về
  const filter = search 
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } 
    : {};

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password") // Không trả về mật khẩu
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const blockUserService = async (userId, status) => {
  // status nên được truyền vào là "block" hoặc "active"
  const user = await User.findByIdAndUpdate(
    userId, 
    { status: status }, 
    { new: true } // Trả về user sau khi đã update
  );

  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  return user;
};

// Service cập nhật role
export const updateRoleService = async (userId, newRole) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { role: newRole },
    { new: true, runValidators: true } // runValidators để check enum ["user", "admin"]
  );

  if (!updatedUser) {
    throw new Error("Không tìm thấy người dùng");
  }

  return updatedUser;
};

export const updateProfileService = async (userId, updateData) => {
  // Lọc ra các trường được phép cập nhật để bảo mật dữ liệu (chừa address ra vì dùng bảng riêng)
  const { name, phone, birthday, gender, avatar } = updateData;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(birthday !== undefined && { birthday }),
        ...(gender !== undefined && { gender }),
        ...(avatar !== undefined && { avatar }),
      },
    },
    { new: true, runValidators: true }
  ).select("-password"); // Không trả về mật khẩu

  if (!updatedUser) {
    throw new Error("Không tìm thấy người dùng");
  }

  return updatedUser;
};