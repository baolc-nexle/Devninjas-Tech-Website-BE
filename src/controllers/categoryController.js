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
  try {
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      image: req.file ? `${req.file.filename}` : null,
    };

    const category = await categoryService.createCategory(categoryData);

    console.log(category);

    return res.status(201).json({
      success: true,
      message: "Create category successfully",
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Chuẩn bị dữ liệu update cơ bản từ body
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
    };

    // 2. Xử lý logic hình ảnh
    if (req.file) {
      // Nếu có upload file mới, dùng tên file mới
      updateData.image = req.file.filename;
    }

    const updatedCategory = await categoryService.updateCategory(
      id,
      updateData,
    );

    return res.status(200).json({
      success: true,
      message: "Update category successfully",
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
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
