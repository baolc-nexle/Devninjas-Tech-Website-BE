export const roleMiddleWare = async (roles = []) => {
  // kiểm tra role truyền vào phải string không nếu đúng đổi lại thành mảng
  if (typeof roles === String) {
    roles = [roles];
  }

  return (req, res, next) => {
    try {
      // kiểm tra user đã đăng nhập chưa
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Bạn chưa đăng nhập" });
      }

      // lấy thuộc tính role của user
      const userRole = req.user.role;

      // kiểm tra role có khớp với role được truyền vào từ router không
      if (!roles.includes(userRole)) {
        return res
          .status(403)
          .json({ success: false, message: "Bạn không có quyền truy cập" });
      }

      // lấy khớp cho đi tiếp
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  };
};
