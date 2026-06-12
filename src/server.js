import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import * as paymentController from "./controllers/paymentController.js";
import dotenv from "dotenv";
import path from "path"; // 1. Thêm path
import { fileURLToPath } from "url"; // 2. Thêm fileURLToPath
import cookieParser from "cookie-parser";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import productVariantsRoutes from "./routes/productVariantsRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
dotenv.config();

// 3. Cấu hình __dirname cho ES Modules (Bắt buộc)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("ENV MONGO:", process.env.MONGO_URI);
//gọi hàm kết nối DB
connectDB();
const app = express();

// middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(cookieParser());

// webhook riêng (KHÔNG qua router payments)
app.post(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook,
);

app.use(express.json());

// 4. CẤU HÌNH STATIC FOLDER (Để xem được ảnh từ trình duyệt)
// Khi FE gọi: http://localhost:5000/uploads/categories/abc.jpg
// Nó sẽ trỏ vào thư mục: backend/public/uploads
// SỬA DÒNG NÀY: Thêm ".." để lùi ra ngoài thư mục src
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads")),
);

// Để kiểm tra chắc chắn, bạn hãy thêm dòng log này ngay dưới:
console.log(
  "Thư mục ảnh thực tế:",
  path.join(__dirname, "..", "public", "uploads"),
);

app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/variants", productVariantsRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/brands", brandRoutes);

// port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
