import { getAllUsersService, blockUserService, updateRoleService, updateProfileService } from "../services/userService.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await getAllUsersService(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // Client gửi lên status mới ("block" hoặc "active")

    const updatedUser = await blockUserService(userId, status);
    
    res.status(200).json({
      success: true,
      message: `Người dùng đã được chuyển sang trạng thái: ${status}`,
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
    console.log("Đã vào tới controller!");
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Gọi service để xử lý nghiệp vụ
    const user = await updateRoleService(userId, role);

    res.status(200).json({
      success: true,
      message: "Cập nhật quyền thành công",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi cập nhật quyền",
    });
  }
};

// Bổ sung controller cập nhật profile cá nhân vào file controller của bạn

export const updateProfile = async (req, res) => {
  try {
    // Lấy userId từ req.user.id (theo đúng đoạn code bạn vừa đưa)
    const userId = req.user.id;

    // Gom dữ liệu từ req.body
    let updateData = { ...req.body };

    // Nếu người dùng có upload file avatar mới, gán filename vào updateData
    if (req.file) {
      updateData.avatar = req.file.filename;
    }

    // Gọi service xử lý cập nhật (đã bỏ address)
    const updatedUser = await updateProfileService(userId, updateData);

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công!",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật thông tin cá nhân",
    });
  }
};