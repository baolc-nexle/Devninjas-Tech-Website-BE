import CategoryAndAttributes from '../models/CategoryAndAttributes.js';
import AttributeValue from '../models/AttributeValue.js';

// Gán thuộc tính vào danh mục
export const assignAttributeToCategory = async (categoryId, attributeId) => {
  return await CategoryAndAttributes.create({ categoryId, attributeId });
};

// Lấy tất cả thuộc tính của một danh mục
export const getAttributesByCategoryId = async (categoryId) => {
  // 1. Tìm các liên kết giữa danh mục và thuộc tính
  const associations = await CategoryAndAttributes.find({ categoryId })
    .populate('attributeId', 'name'); // Chỉ lấy tên thuộc tính (VD: "Dung lượng")

  // 2. Với mỗi liên kết, truy vấn thêm các giá trị thuộc tính tương ứng
  const fullData = await Promise.all(associations.map(async (item) => {
    // Tìm tất cả giá trị thuộc tính (Value) có cùng attributeId
    const values = await AttributeValue.find({ attributeId: item.attributeId._id });
    
    return {
      attributeId: item.attributeId, // Chứa { _id, name }
      values: values // Chứa mảng [ { _id, value: "128GB" }, { _id, value: "256GB" } ]
    };
  }));

  return fullData;
};

// Xóa thuộc tính khỏi danh mục
export const removeAttributeFromCategory = async (categoryId, attributeId) => {
  return await CategoryAndAttributes.findOneAndDelete({ categoryId, attributeId });
};