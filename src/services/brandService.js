import mongoose from "mongoose";
import Brand from "../models/brand.js";

export const createBrand = async (data) => {
  if (!data) {
    throw new Error("Dữ liệu không được để trống");
  }

  const existBrand = await Brand.findOne({ name: data.name });

  if (existBrand) {
    throw new Error("Tên brand đã tồn tại");
  }

  return await Brand.create(data);
};

export const getAllBrands = async () => {
  return await Brand.find().sort({ createdAt: -1 });
};

export const getBrandById = async (brandId) => {
  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    throw new Error("Id không hợp lệ");
  }

  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new Error("Brand không tồn tại");
  }

  return brand;
};

export const updateBrand = async (brandId, data) => {
  if (!data) {
    throw new Error("Dữ liệu trống không thể update");
  }

  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    throw new Error("Id không hợp lệ");
  }

  const brand = await Brand.findByIdAndUpdate(brandId, data);

  if (!brand) {
    throw new Error("không thể update brand");
  }

  return brand;
};

export const deleteBrand = async (brandId) => {
  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    throw new Error("Id không hợp lệ");
  }

  const brand = await Brand.findByIdAndDelete(brandId);

  if (!brand) {
    throw new Error("Không thể delete brand");
  }

  return brand;
};
