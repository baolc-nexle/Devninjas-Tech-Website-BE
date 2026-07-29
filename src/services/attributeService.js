import Attribute from "../models/Attribute.js";
import mongoose from "mongoose";

export const createAttribute = async (data) => {
  const { name } = data;

  if (!name?.trim()) {
    throw new Error("Tên thuộc tính là bắt buộc");
  }

  const existAttribute = await Attribute.findOne({
    name: name.trim(),
  });

  // NẾU ĐÃ TỒN TẠI: Trả về luôn thông tin thuộc tính cũ thay vì báo lỗi
  if (existAttribute) {
    return existAttribute; 
  }

  // NẾU CHƯA: Tạo mới bình thường
  return await Attribute.create({
    name: name.trim(),
  });
};
export const getAllAttributes = async () => {
  return await Attribute.aggregate([
    // 1. Sắp xếp trước khi lookup để đảm bảo thứ tự createdAt
    { $sort: { createdAt: -1 } },
    
    // 2. Kết nối với bảng AttributeValue
    {
      $lookup: {
        from: "attributevalues", // Tên collection của bảng AttributeValue trong MongoDB (thường là số nhiều, chữ thường)
        localField: "_id",       // Trường ID ở bảng Attribute
        foreignField: "attributeId", // Trường tham chiếu ở bảng AttributeValue
        as: "values"             // Tên trường chứa mảng kết quả trả về
      }
    }
  ]);
};

export const getAttributeById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID không hợp lệ");
  }

  const attribute = await Attribute.findById(id);

  if (!attribute) {
    throw new Error("Không tìm thấy thuộc tính");
  }

  return attribute;
};

export const updateAttribute = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID không hợp lệ");
  }

  const attribute = await Attribute.findById(id);

  if (!attribute) {
    throw new Error("Không tìm thấy thuộc tính");
  }

  if (data.name) {
    const existAttribute = await Attribute.findOne({
      name: data.name.trim(),
      _id: { $ne: id },
    });

    if (existAttribute) {
      throw new Error("Tên thuộc tính đã tồn tại");
    }

    attribute.name = data.name.trim();
  }

  await attribute.save();

  return attribute;
};

export const deleteAttribute = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID không hợp lệ");
  }

  const attribute = await Attribute.findById(id);

  if (!attribute) {
    throw new Error("Không tìm thấy thuộc tính");
  }

  await Attribute.findByIdAndDelete(id);

  return attribute;
};