import * as ProductService from "../services/ProductService.js";

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

// GET BY ID
export const getProductById = async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Get product successfully",
      data: product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
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

    const productData = {
      name: req.body.name,
      basePrice: Number(req.body.basePrice),
      stock: Number(req.body.stock) || 0, // // Ép kiểu số để chắc chắn khớp Schema
      description: req.body.description,
      status: req.body.status || "Active",
      slug: slug, // BẮT BUỘC CÓ
      categoryId: req.body.categoryId, // BẮT BUỘC CÓ
      image: req.file ? `${req.file.filename}` : "",
      isFeatured: req.body.isFeatured === "true", // Chuyển từ string "true" của FormData sang Boolean
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
    const slug =
      req.body.slug ||
      req.body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .trim();

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
