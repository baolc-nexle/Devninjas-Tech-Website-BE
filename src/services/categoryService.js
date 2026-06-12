import Category from "../models/Category.js";
import mongoose, { Error } from "mongoose";

const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID Không hợp lệ");
  }
};

export const getAllCategory = async () => {
  return await Category.find().sort({ createdAt: -1 });
};

export const createCategory = async (data) => {
  // check category có được để trống không
  if (!data || Object.keys(data).length === 0) {
    throw new Error("Dữ liệu không được để trống");
  }

  if (!data.name || data.name.trim() === "") {
    throw new Error("Tên danh mục không được để trống");
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

export const updateCategory = async (id, data) => {
  validateId(id);

  if (!data || Object.keys(data).length === 0) {
    throw new Error("Không có Dữ liệu cập nhập");
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
