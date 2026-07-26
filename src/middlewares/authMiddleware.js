import jwt from "jsonwebtoken";

// export const authMiddleWare = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({
//         success: false,
//         message: "Token không tồn tại",
//       });
//     }

//     const parts = authHeader.split(" ");

//     if (parts.length !== 2 || parts[0] !== "Bearer") {
//       return res.status(401).json({
//         success: false,
//         message: "Sai định dạng token",
//       });
//     }

//     const token = parts[1];

//     if (!token || token === "undefined") {
//       return res.status(401).json({
//         success: false,
//         message: "Token không hợp lệ",
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = decoded;

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Token hết hạn hoặc không hợp lệ",
//     });
//   }
// };




export const authMiddleWare = (req, res, next) => {
  try {
    // 1. Debug xem toàn bộ Cookies mà server nhận được
    // console.log("--- DEBUG AUTH ---");
    // console.log("Cookies nhận được:", req.cookies); 
    // console.log("Headers nhận được:", req.headers.cookie); // Kiểm tra raw cookie string

    const token = req.cookies.accessToken;

    // 2. Kiểm tra log token
    // console.log("Token trích xuất được:", token);

    if (!token) {
      console.log("LỖI: Token không tồn tại trong cookie");
      return res.status(401).json({
        success: false,
        message: "Token không tồn tại",
      });
    }

    if (token === "undefined") {
      console.log("LỖI: Token là chuỗi 'undefined'");
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token hợp lệ, user:", decoded.id);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("LỖI XÁC THỰC:", error.message); // Log lỗi chi tiết (expired/invalid signature)
    return res.status(401).json({
      success: false,
      message: "Token hết hạn hoặc không hợp lệ",
      error: error.message // Gửi lỗi về để debug trên frontend dễ hơn
    });
  }
};