import multer from "multer";
import path from "path";
import fs from "fs"; // Thêm dòng này

// const uploadPath = "public/uploads/categories/";

// TỰ ĐỘNG TẠO THƯ MỤC NẾU CHƯA CÓ
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
//   console.log("--- Đã tự động tạo thư mục upload ---");
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // process.cwd() trỏ thẳng đến thư mục gốc của project (website-thuong-mai-dien-tu/backend)
//     const uploadPath = path.join(
//       process.cwd(),
//       "public",
//       "uploads",
//       "categories",
//     );

//     // Đảm bảo folder tồn tại (Nếu bạn đã có đoạn check fs.mkdirSync ở trên thì có thể bỏ qua dòng này)
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }

//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, `cat-${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// export default upload;

// ✅ Factory function - truyền vào folder nào thì upload vào đó
const createUploader = (folder) => {
  const uploadPath = path.join(process.cwd(), "public", "uploads", folder);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${folder}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 30 * 1024 * 1024 },
  });
};

export default createUploader;
