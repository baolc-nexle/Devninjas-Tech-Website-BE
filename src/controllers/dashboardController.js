import * as dashboardService from "../services/dashboardService.js";


export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Lấy tham số từ query
    const { days, startDate, endDate } = req.query;

    // 2. Xử lý logic 'days' (giữ nguyên logic kiểm tra của bạn)
    let parsedDays = parseInt(days);
    if (isNaN(parsedDays) || parsedDays < 1) {
      parsedDays = 30;
    }

    // 3. Truyền cả 3 tham số xuống service
    // Service sẽ tự quyết định dùng startDate/endDate (nếu có) hoặc dùng days
    const stats = await dashboardService.getDashboardStats(
      parsedDays, 
      startDate, 
      endDate
    );

    // 4. Trả về kết quả
    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu dashboard thành công",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardChart = async (req, res, next) => {
  try {
    const { days, startDate, endDate } = req.query;
    
    // Gọi service để lấy dữ liệu biểu đồ
    const chartData = await dashboardService.getChartData(days || 30, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryStats = async (req, res) => {
  try {
    // Lấy khoảng thời gian từ query params (định dạng: ?startDate=...&endDate=...)
    const { startDate, endDate } = req.query;

    // Chuyển đổi sang Date object để service xử lý
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await dashboardService.getCategoryStats(start, end);

    console.log("Kết quả từ Service:", result);
    
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};