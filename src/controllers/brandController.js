import * as brandService from "../services/brandService.js";

// CREATE
export const createBrand = async (req, res) => {
  try {
    const brand = await brandService.createBrand(req.body);

    return res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL
export const getAllBrands = async (req, res) => {
  try {
    const brands = await brandService.getAllBrands();

    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY ID
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await brandService.getBrandById(id);

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await brandService.updateBrand(id, req.body);

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await brandService.deleteBrand(id);

    return res.status(200).json({
      success: true,
      message: "Xoá brand thành công",
      data: brand,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
