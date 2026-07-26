import * as attributeService from "../services/attributeService.js";

export const createAttribute = async (req, res) => {
  try {
    const attribute = await attributeService.createAttribute(req.body);

    return res.status(201).json({
      success: true,
      message: "Tạo thuộc tính thành công",
      data: attribute,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAttributes = async (req, res) => {
  try {
    const attributes = await attributeService.getAllAttributes();

    return res.status(200).json({
      success: true,
      data: attributes,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAttributeById = async (req, res) => {
  try {
    const attribute = await attributeService.getAttributeById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAttribute = async (req, res) => {
  try {
    const attribute = await attributeService.updateAttribute(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thuộc tính thành công",
      data: attribute,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAttribute = async (req, res) => {
  try {
    await attributeService.deleteAttribute(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa thuộc tính thành công",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};