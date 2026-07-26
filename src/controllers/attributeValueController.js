import * as attributeValueService from "../services/attributeValueService.js";

export const createAttributeValue = async (req, res) => {
  try {
    const value = await attributeValueService.createAttributeValue(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Tạo giá trị thuộc tính thành công",
      data: value,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAttributeValues = async (req, res) => {
  try {
    const values =
      await attributeValueService.getAllAttributeValues();

    return res.status(200).json({
      success: true,
      data: values,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAttributeValueById = async (req, res) => {
  try {
    const value =
      await attributeValueService.getAttributeValueById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: value,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getValuesByAttribute = async (req, res) => {
  try {
    const values =
      await attributeValueService.getValuesByAttribute(
        req.params.attributeId
      );

    return res.status(200).json({
      success: true,
      data: values,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAttributeValue = async (req, res) => {
  try {
    const value =
      await attributeValueService.updateAttributeValue(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Cập nhật giá trị thuộc tính thành công",
      data: value,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAttributeValue = async (req, res) => {
  try {
    await attributeValueService.deleteAttributeValue(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Xóa giá trị thuộc tính thành công",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};