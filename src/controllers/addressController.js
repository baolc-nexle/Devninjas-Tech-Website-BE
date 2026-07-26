import * as addressService from "../services/addressService.js";

// 1. Lấy danh sách địa chỉ của user đang đăng nhập
export const getAddressesController = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware xác thực (verifyToken)
    const result = await addressService.getAddressesByUserService(userId, req.query);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách địa chỉ thành công",
      ...result, // Trả về data và pagination
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy danh sách địa chỉ",
    });
  }
};

// 2. Thêm địa chỉ mới
export const createAddressController = async (req, res) => {
  try {
    const userId = req.user.id;
    const newAddress = await addressService.createAddressService(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Thêm địa chỉ thành công!",
      data: newAddress,
    });
  } catch (error) {
    const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Lỗi server khi thêm địa chỉ",
    });
  }
};

// 3. Cập nhật địa chỉ theo ID
export const updateAddressController = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;
    const updatedAddress = await addressService.updateAddressService(userId, addressId, req.body);

    return res.status(200).json({
      success: true,
      message: "Cập nhật địa chỉ thành công!",
      data: updatedAddress,
    });
  } catch (error) {
    const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Lỗi server khi cập nhật địa chỉ",
    });
  }
};

// 4. Xóa địa chỉ theo ID
export const deleteAddressController = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;
    const result = await addressService.deleteAddressService(userId, addressId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Lỗi server khi xóa địa chỉ",
    });
  }
};