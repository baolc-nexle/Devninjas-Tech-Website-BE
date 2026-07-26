import * as ratingService from "../services/ratingService.js"; // Giả định đường dẫn tới file service của bạn

/**
 * 1. Controller tạo đánh giá mới
 * POST /api/ratings
 */
export const createRatingController = async (req, res) => {
  try {
    // Lấy userId từ middleware xác thực (Authentication Middleware thường gắn req.user hoặc req.userId)
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
      });
    }

    // Gọi service xử lý logic tạo đánh giá
    const newRating = await ratingService.createRating(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Đánh giá sản phẩm thành công!",
      data: newRating,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Đã xảy ra lỗi khi tạo đánh giá.",
    });
  }
};

/**
 * 2. Controller lấy danh sách đánh giá theo sản phẩm
 * GET /api/ratings/product/:productId?page=1&limit=10&star=5
 */
export const getRatingsByProductController = async (req, res) => {
  try {
    const { productId } = req.params;
    const queryParams = req.query; // Nhận các query params như page, limit, star từ URL

    // Gọi service lấy danh sách kèm phân trang
    const result = await ratingService.getRatingsByProduct(productId, queryParams);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đánh giá thành công",
      data: result.ratings,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Không thể lấy danh sách đánh giá.",
    });
  }
};