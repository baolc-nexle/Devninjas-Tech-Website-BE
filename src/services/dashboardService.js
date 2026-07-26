import Order from "../models/Order.js"; // Giả định tên model Order.js
import Product from "../models/Product.js";
import User from "../models/User.js";

export const getDashboardStats = async (days = 30, startDateParam = null, endDateParam = null) => {
  let startDate;
  let endDate = new Date(); // Mặc định endDate là hôm nay

  // Kiểm tra nếu có custom date (dạng chuỗi "YYYY-MM-DD")
  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
    // Đặt endDate là cuối ngày để lấy toàn bộ đơn hàng trong ngày đó
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Nếu dùng preset (7, 30, 90)
    const d = parseInt(days);
    startDate = new Date();
    startDate.setDate(startDate.getDate() - d);
  }

  // Truy vấn với điều kiện thời gian linh hoạt
  const [revenueData, totalOrders] = await Promise.all([
    Order.aggregate([
      { 
        $match: { 
          paymentStatus: "paid", 
          createdAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]),
    Order.countDocuments({ 
      createdAt: { $gte: startDate, $lte: endDate } 
    })
  ]);

  const [totalProducts, totalCustomers] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments()
  ]);

  return {
    totalRevenue: revenueData[0]?.total || 0,
    totalOrders,
    totalProducts,
    totalCustomers,
  };
};

export const getChartData = async (days = 30, startDateParam = null, endDateParam = null) => {
  let startDate;
  let endDate = new Date();

  // 1. Logic xử lý khoảng thời gian
  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999); // Đảm bảo lấy hết các đơn trong ngày cuối
  } else {
    const d = parseInt(days);
    startDate = new Date();
    startDate.setDate(startDate.getDate() - d);
  }

  // 2. Thực hiện truy vấn MongoDB
  const chartData = await Order.aggregate([
    { 
      $match: { 
        paymentStatus: "paid", 
        createdAt: { $gte: startDate, $lte: endDate } 
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: "%d/%m", date: "$createdAt" } },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 },
        // AOV = Tổng doanh thu / Tổng số đơn
        aov: { $avg: "$totalPrice" }
      }
    },
    { $sort: { _id: 1 } }, // Sắp xếp theo ngày tăng dần
    { 
      $project: { 
        _id: 0, 
        date: "$_id", 
        revenue: 1, 
        orders: 1, 
        aov: { $round: ["$aov", 0] } // Làm tròn AOV cho đẹp
      } 
    }
  ]);

  return chartData;
};

export const getCategoryStats = async (startDate, endDate) => {
  console.log("DEBUG - Input Dates:", startDate, endDate);

  const pipeline = [
    // 1. Lọc đơn hàng
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "paid", 
      } 
    },
    // 2. Facet để kiểm tra số lượng tại từng bước
    {
      $facet: {
        "totalOrdersFound": [{ $count: "count" }], // Đếm xem có bao nhiêu order khớp
        "data": [
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "productInfo"
            }
          },
          { $unwind: "$productInfo" },
          {
            $lookup: {
              from: "categories",
              localField: "productInfo.categoryId",
              foreignField: "_id",
              as: "categoryDetails"
            }
          },
          { $unwind: "$categoryDetails" },
          {
            $group: {
              _id: "$categoryDetails.name",
              value: { $sum: "$items.quantity" }
            }
          },
          {
            $project: {
              _id: 0,
              name: "$_id",
              value: 1
            }
          }
        ]
      }
    }
  ];

  const result = await Order.aggregate(pipeline);
  
  // Log kết quả kiểm tra
  console.log("DEBUG - Total Orders Found:", result[0].totalOrdersFound);
  console.log("DEBUG - Final Data:", result[0].data);

  return { data: result[0].data };
};