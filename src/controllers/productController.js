import * as ProductService from "../services/ProductService.js";
import mongoose from "mongoose";

// GET ALL
export const getAllProducts = async (req, res) => {
  try {
    const products = await ProductService.getAllProducts();

    return res.status(200).json({
      success: true,
      message: "Get all products successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHomePageData = async (req, res) => {
  try {
    // Chạy song song 3 truy vấn để tăng tốc độ phản hồi
    const [newProducts, featuredProducts, bestSellers] = await Promise.all([
      ProductService.getNewProducts(4),
      ProductService.getFeaturedProducts(4),
      ProductService.getBestSellerProducts(4)
    ]);

    return res.status(200).json({
      success: true,
      message: "Get home page data successfully",
      data: {
        newProducts,
        featuredProducts,
        bestSellers
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra xem ID có đúng định dạng MongoDB ObjectId không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không đúng định dạng",
      });
    }

    // 2. Gọi service
    const product = await ProductService.getProductById(id);

    // 3. Xử lý trường hợp không tìm thấy sản phẩm
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm với ID này",
      });
    }

    // 4. Phản hồi thành công
    return res.status(200).json({
      success: true,
      message: "Get product successfully",
      data: product,
    });
  } catch (error) {
    // Log lỗi để bạn biết server đang bị gì
    console.error("Lỗi tại getProductById:", error);
    
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống: " + error.message,
    });
  }
};

// CREATE
export const createProduct = async (req, res) => {
  try {
    // 1. Tạo slug từ name nếu không có slug gửi lên
    const slug =
      req.body.slug ||
      req.body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .trim();

    // 2. Xử lý parse trường specifications từ chuỗi JSON (do FormData gửi lên)
    let parsedSpecifications = [];
    if (req.body.specifications) {
      try {
        // Nếu client gửi dạng JSON string thì parse, nếu đã là object/array thì giữ nguyên
        parsedSpecifications = typeof req.body.specifications === "string" 
          ? JSON.parse(req.body.specifications) 
          : req.body.specifications;
      } catch (err) {
        console.error("Lỗi parse specifications:", err);
        parsedSpecifications = [];
      }
    }

    const productData = {
      name: req.body.name,
      basePrice: Number(req.body.basePrice),
      stock: Number(req.body.stock) || 0, // Ép kiểu số để chắc chắn khớp Schema
      description: req.body.description,
      status: req.body.status || "Active",
      slug: slug, // BẮT BUỘC CÓ
      categoryId: req.body.categoryId, // BẮT BUỘC CÓ
      brandId: req.body.brandId, 
      image: req.file ? `${req.file.filename}` : "",
      isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true, // Xử lý cả boolean lẫn string "true"
      specifications: parsedSpecifications, // <--- BỔ SUNG TRƯỜNG NÀY VÀO
    };

    const newProduct = await ProductService.createProduct(productData);

    return res.status(201).json({
      success: true,
      message: "Create product successfully",
      data: newProduct,
    });
  } catch (error) {
    // Log lỗi ra terminal để debug chính xác lỗi gì (ví dụ: lỗi trùng slug)
    console.error("Backend Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
export const updateProduct = async (req, res) => {
  try {

    // SỬA ĐOẠN NÀY:
    const name = req.body.name || ""; // Nếu không có name thì dùng chuỗi rỗng

    const slug = req.body.slug || (name ? name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .trim() : ""); // Nếu name rỗng thì slug rỗng

    const newData = {
      name: req.body.name,
      basePrice: Number(req.body.basePrice),
      description: req.body.description,
      status: req.body.status || "Active",
      slug: slug,
      categoryId: req.body.categoryId,
      isFeatured: req.body.isFeatured === "true",
    };

    // chỉ update image khi có upload ảnh mới
    if (req.file) {
      newData.image = req.file.filename;
    }

    const updatedProduct = await ProductService.updateProduct(
      req.params.id,
      newData,
    );

    return res.status(200).json({
      success: true,
      message: "Update product successfully",
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await ProductService.deleteProduct(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Delete product successfully",
      data: deletedProduct,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// export const getProductsByCategory = async (req, res) => {
//   try {
//     // Lấy categoryId từ URL params (ví dụ: /api/products/category/:categoryId)
    
//     const { categoryId } = req.params;
    
//     // Lấy page và limit từ query params (ví dụ: ?page=1&limit=8)
//     // Nếu không có thì mặc định page = 1, limit = 8
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 8;

//     const result = await ProductService.getProductsByCategory(categoryId, limit, page);

//     return res.status(200).json({
//       success: true,
//       message: "Lấy danh sách sản phẩm theo danh mục thành công",
//       data: result, // result chứa: products, totalProducts, totalPages, currentPage
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // 1. Lấy pagination từ query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    // 2. Lấy filters từ query (nếu không có thì để rỗng)
    const filters = {
      minPrice: req.query.minPrice || null,
      maxPrice: req.query.maxPrice || null,
      // Chuyển chuỗi "id1,id2,id3" thành mảng ["id1", "id2", "id3"]
      attributeValueIds: req.query.attrIds ? req.query.attrIds.split(',') : []
    };

    // 3. Gọi Service với tham số mới
    const result = await ProductService.getProductsByCategory(categoryId, limit, page, filters);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm theo danh mục thành công",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};