import * as categoryAttributeService from '../services/categoryAttributeService.js';

// POST /api/category-attributes/assign
export const assignAttribute = async (req, res) => {
  try {
    const { categoryId, attributeId } = req.body;
    const result = await categoryAttributeService.assignAttributeToCategory(categoryId, attributeId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/category-attributes/:categoryId
export const getAttributes = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const attributes = await categoryAttributeService.getAttributesByCategoryId(categoryId);
    res.status(200).json({ success: true, data: attributes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};