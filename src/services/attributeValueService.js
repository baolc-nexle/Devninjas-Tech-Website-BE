import AttributeValue from "../models/AttributeValue.js";

// Tạo mới
export const createAttributeValue = async (data) => {
  return await AttributeValue.create(data);
};

// Lấy danh sách tất cả
export const getAllAttributeValues = async () => {
  return await AttributeValue.find().populate('attributeId'); // Giả sử bạn muốn lấy thông tin thuộc tính cha
};

// Lấy theo ID
export const getAttributeValueById = async (id) => {
  const value = await AttributeValue.findById(id);
  if (!value) {
    throw new Error("Giá trị thuộc tính không tồn tại");
  }
  return value;
};

// Lấy theo Attribute ID
export const getValuesByAttribute = async (attributeId) => {
  return await AttributeValue.find({ attributeId });
};

// Cập nhật
export const updateAttributeValue = async (id, data) => {
  const updatedValue = await AttributeValue.findByIdAndUpdate(id, data, {
    new: true, // Trả về document sau khi đã update
    runValidators: true, // Chạy lại validation của schema
  });
  
  if (!updatedValue) {
    throw new Error("Không tìm thấy giá trị thuộc tính để cập nhật");
  }
  return updatedValue;
};

// Xóa
export const deleteAttributeValue = async (id) => {
  const deletedValue = await AttributeValue.findByIdAndDelete(id);
  
  if (!deletedValue) {
    throw new Error("Không tìm thấy giá trị thuộc tính để xóa");
  }
  return deletedValue;
};