import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { syncVariants } from "./productVariantService.js";
import ProductVariant from "../models/ProductVariant.js";
import mongoose from "mongoose";

// check format id
const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID không hợp lệ");
  }
};

// get all
export const getAllProducts = async () => {
  return await Product.find()
    .sort({ createdAt: -1 })
    .populate("categoryId", "name");
};

// Lấy sản phẩm mới nhất
export const getNewProducts = async (limit = 8) => {
  const products = await Product.find({ status: "Active" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("categoryId", "name");
  
  return attachTagsToProducts(products); // GỌI HÀM HELPER Ở ĐÂY
};

// Lấy sản phẩm nổi bật
export const getFeaturedProducts = async (limit = 8) => {
  const products = await Product.find({ status: "Active", isFeatured: true })
    .limit(limit)
    .populate("categoryId", "name");
    
  return attachTagsToProducts(products); // GỌI HÀM HELPER Ở ĐÂY
};

// Lấy sản phẩm bán chạy
export const getBestSellerProducts = async (limit = 8) => {
  const products = await Product.find({ status: "Active" })
    .sort({ soldCount: -1 })
    .limit(limit)
    .populate("categoryId", "name");
    
  return attachTagsToProducts(products); // GỌI HÀM HELPER Ở ĐÂY
};
// get by id
export const getProductById = async (id) => {
  validateId(id);

  const product = await Product.findById(id)
    .populate('variants')
    .populate('brandId', 'name slug')       // Lấy tên và slug của Brand
    .populate('categoryId', 'name slug');   // Lấy tên và slug của Category

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  return product;
};

// create
export const createProduct = async (data) => {
  // 1. Validation (Giữ nguyên các check của bạn)
  if (!data || Object.keys(data).length === 0) {
    throw new Error("Dữ liệu không được để trống");
  }
  if (!data.name || data.name.trim() === "") {
    throw new Error("Tên sản phẩm không được để trống");
  }
  if (!data.categoryId) {
    throw new Error("Danh mục không được để trống");
  }

  // 2. Kiểm tra category (Giữ nguyên)
  const category = await Category.findById(data.categoryId);
  if (!category) {
    throw new Error("Danh mục không tồn tại");
  }

  console.log("Check data.stock", data.stock);

  // Kiểm tra nếu stock gửi lên là string (do FormData luôn gửi string), hãy ép về Number
  const finalStock = Number(data.stock) || 0;
  // Thêm log để bắt bệnh

  // 4. Tạo sản phẩm với trường stock đã tính tổng
  const productData = {
    ...data,
    stock: finalStock, // Gán giá trị tổng vào đây để lưu vào DB
  };

  const newProduct = await Product.create(productData);
  // --- KẾT THÚC PHẦN XỬ LÝ MỚI ---

  // 5. Cập nhật product_count cho category (Giữ nguyên)
  await Category.findByIdAndUpdate(data.categoryId, {
    $inc: { product_count: 1 },
  });

  return newProduct;
};

// update
export const updateProduct = async (id, data) => {
  validateId(id);

  if (!data || Object.keys(data).length === 0) {
    throw new Error("Không có dữ liệu để cập nhật");
  }

  // tách variants ra khỏi product data
  const { variants, ...productData } = data;

  // update product
  const product = await Product.findByIdAndUpdate(id, productData, {
    new: true,
  });

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // sync variants
  if (variants && Array.isArray(variants)) {
    await syncVariants(id, variants);
  }

  return product;
};

// delete
export const deleteProduct = async (id) => {
  validateId(id);

  // 1. Tìm product trước
  const product = await Product.findById(id);

  const category = await Category.findById(product.categoryId);

  if (!product) {
    throw new Error("Sản phẩm không tồn tại");
  }

  await ProductVariant.deleteMany({ productId: id }); // Xóa hết biến thể liên quan đến sản phẩm này

  // 2. Xóa product
  await Product.findByIdAndDelete(id);

  // 3. Giảm product_count (chỉ khi active)
  if (product.status === "Active") {
    await Category.findByIdAndUpdate(
      product.categoryId,
      {
        $inc: { product_count: -1 },
      },
      { new: true },
    );
  }

  return {
    message: "Xóa sản phẩm thành công",
  };
};


// Lấy sản phẩm theo danh mục (hỗ trợ phân trang nếu cần)
// export const getProductsByCategory = async (categoryId, limit = 20, page = 1) => {
//   validateId(categoryId); // Kiểm tra định dạng ID danh mục

//   // Kiểm tra xem danh mục có tồn tại hay không (tuỳ chọn, để tăng trải nghiệm người dùng)
//   const category = await Category.findById(categoryId);
//   if (!category) {
//     throw new Error("Danh mục không tồn tại");
//   }

//   // Tính toán offset cho phân trang
//   const skip = (page - 1) * limit;

//   // Truy vấn sản phẩm theo categoryId
//   const products = await Product.find({ 
//     categoryId: categoryId,
//     status: "Active" // Chỉ lấy sản phẩm đang hoạt động
//   })
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit)
//     .populate("categoryId", "name");

//   // Đếm tổng số sản phẩm trong danh mục này (hữu ích cho frontend làm pagination)
//   const totalProducts = await Product.countDocuments({ 
//     categoryId: categoryId,
//     status: "Active" 
//   });

//   return {
//     products,
//     totalProducts,
//     totalPages: Math.ceil(totalProducts / limit),
//     currentPage: page
//   };
// };

export const getProductsByCategory = async (categoryId, limit = 20, page = 1, filters = {}) => {
  validateId(categoryId);

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new Error("Danh mục không tồn tại");
  }

  // Kiểm tra xem người dùng có đang dùng bộ lọc không
  const isFiltering = filters.minPrice || filters.maxPrice || (filters.attributeValueIds && filters.attributeValueIds.length > 0);

  let products;
  let totalProducts;

  if (!isFiltering) {
    // TRƯỜNG HỢP 1: KHÔNG LỌC - Lấy trực tiếp từ bảng Product
    const skip = (page - 1) * limit;
    products = await Product.find({ 
      categoryId: categoryId, 
      status: "Active" 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name");

    totalProducts = await Product.countDocuments({ 
      categoryId: categoryId, 
      status: "Active" 
    });
  } else {
    // TRƯỜNG HỢP 2: CÓ LỌC - Lấy qua bảng ProductVariant
    // 1. Xây dựng bộ lọc cho Variant
    let variantMatch = { isActive: true };
    if (filters.minPrice || filters.maxPrice) {
      variantMatch.price = {};
      if (filters.minPrice) variantMatch.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice) variantMatch.price.$lte = Number(filters.maxPrice);
    }
    if (filters.attributeValueIds && filters.attributeValueIds.length > 0) {
      variantMatch["attributes.attributeValueId"] = { $all: filters.attributeValueIds };
    }

    // 2. Lấy danh sách biến thể thỏa mãn bộ lọc
    const variants = await ProductVariant.find(variantMatch).populate({
      path: "productId",
      match: { categoryId: categoryId, status: "Active" }
    });

    // 3. Lọc ra danh sách Product ID duy nhất từ các biến thể
    const uniqueProductIds = [...new Set(variants.filter(v => v.productId).map(v => v.productId._id))];

    // 4. Phân trang và lấy chi tiết sản phẩm dựa trên ID đã lọc
    const skip = (page - 1) * limit;
    products = await Product.find({ _id: { $in: uniqueProductIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name");

    totalProducts = uniqueProductIds.length;
  }

  return {
    products,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limit),
    currentPage: page
  };
};

// Thêm hàm helper này vào cuối file productService.js
const attachTagsToProducts = (products) => {
  return products.map(product => {
    // Chuyển đổi mongoose document sang plain object để có thể thêm thuộc tính
    const p = product.toObject ? product.toObject() : product;
    
    let tag = null;
    // Logic ưu tiên: Bán chạy > Nổi bật > Mới
    if (p.soldCount > 50) {
      tag = "BÁN CHẠY";
    } else if (p.isFeatured) {
      tag = "NỔI BẬT";
    } else {
      // Kiểm tra nếu sản phẩm tạo trong vòng 30 ngày
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(p.createdAt) > thirtyDaysAgo) {
        tag = "MỚI";
      }
    }
    
    return { ...p, tag }; // Trả về object đã gắn tag
  });
};