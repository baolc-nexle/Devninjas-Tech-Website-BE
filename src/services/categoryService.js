import Category from "../models/Category.js";
import slugify from "slugify";
import mongoose, { Error } from "mongoose";

const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID Không hợp lệ");
  }
};

// Lấy danh mục, ưu tiên hiển thị theo displayOrder
export const getAllCategory = async () => {
  return await Category.find({ status: "Active" }).sort({ displayOrder: 1 });
};

// BỔ SUNG: Lấy danh mục nổi bật cho trang chủ
export const getFeaturedCategories = async () => {
  return await Category.find({ isFeatured: true, status: "Active" }).sort({ displayOrder: 1 });
};

export const createCategory = async (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("Dữ liệu không được để trống");
  }

  if (!data.name || data.name.trim() === "") {
    throw new Error("Tên danh mục không được để trống");
  }

  // Tự động tạo slug nếu người dùng không truyền vào
  if (!data.slug) {
    data.slug = slugify(data.name, { lower: true, locale: 'vi' });
  }

  return await Category.create(data);
};

export const getCategoryById = async (id) => {
  validateId(id);
  const categoryById = await Category.findById(id);
  if (!categoryById) {
    throw new Error("Danh mục không tồn tại");
  }
  return categoryById;
};

// BỔ SUNG: Lấy danh mục theo slug (dùng cho SEO)
export const getCategoryBySlug = async (slug) => {
  const category = await Category.findOne({ slug });
  if (!category) throw new Error("Danh mục không tồn tại");
  return category;
};

export const updateCategory = async (id, data) => {
  validateId(id);

  if (!data || Object.keys(data).length === 0) {
    throw new Error("Không có dữ liệu cập nhật");
  }

  // Nếu có cập nhật tên, tự động cập nhật lại slug
  if (data.name) {
    data.slug = slugify(data.name, { lower: true, locale: 'vi' });
  }

  const updateCategory = await Category.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!updateCategory) {
    throw new Error("Danh mục không tồn tại");
  }

  return updateCategory;
};

export const deleteCategory = async (id) => {
  validateId(id);
  const deleteCategory = await Category.findByIdAndDelete(id);
  if (!deleteCategory) {
    throw new Error("Danh mục không tồn tại");
  }
  return { message: "Xóa danh mục thành công" };
};