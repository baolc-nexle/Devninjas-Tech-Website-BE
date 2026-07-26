import * as categoryService from "../services/categoryService.js";
import fs from "fs";
import path from "path";

// GET ALL
export const getAllCategory = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategory();

    return res.status(200).json({
      success: true,
      message: "Get all categories successfully",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Get category successfully",
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE
export const createCategory = async (req, res) => {
  console.log("Giá trị thực của req.body.isFeatured:", req.body.isFeatured, "Kiểu dữ liệu:", typeof req.body.isFeatured);
  try {
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
     isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
      displayOrder: req.body.displayOrder || 0,
      icon: req.body.icon,
      image: req.file ? `${req.file.filename}` : null,
    };

    console.log("Dữ liệu trước khi gọi service:", categoryData); // Log thử ở đây

    const category = await categoryService.createCategory(categoryData);
    return res.status(201).json({ success: true, message: "Create category successfully", data: category });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured === 'true' : undefined,
      displayOrder: req.body.displayOrder,
      icon: req.body.icon
    };

    if (req.file) {
      updateData.image = req.file.filename;
      // Lưu ý: Nếu muốn chuyên nghiệp hơn, bạn nên xóa ảnh cũ tại đây giống như hàm deleteCategory
    }

    const updatedCategory = await categoryService.updateCategory(id, updateData);
    return res.status(200).json({ success: true, message: "Update category successfully", data: updatedCategory });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
// DELETE

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm thông tin danh mục trước khi xóa để lấy tên file ảnh
    // Giả sử bạn có hàm getCategoryById trong service
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục để xóa",
      });
    }

    // 2. Thực hiện xóa danh mục trong Database
    const deletedCategory = await categoryService.deleteCategory(id);

    // 3. Xử lý xóa file ảnh vật lý nếu danh mục có ảnh
    if (category.image) {
      // Xây dựng đường dẫn tuyệt đối tới file
      const imagePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "categories",
        category.image,
      );

      // Kiểm tra file có tồn tại trên ổ cứng không rồi mới xóa
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Lỗi khi xóa file ảnh vật lý:", err);
            // Không nhất thiết phải return lỗi ở đây vì Database đã xóa xong
          } else {
            console.log(`--- Đã xóa thành công file: ${category.image} ---`);
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Xóa danh mục và ảnh thành công",
      data: deletedCategory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET FEATURED CATEGORIES (Dùng cho Trang chủ)
export const getFeaturedCategories = async (req, res) => {
  try {
    const categories = await categoryService.getFeaturedCategories();
    return res.status(200).json({
      success: true,
      message: "Get featured categories successfully",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY SLUG (Dùng cho SEO - Thay thế/Bổ sung cho GetById)
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    return res.status(200).json({
      success: true,
      message: "Get category by slug successfully",
      data: category,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};