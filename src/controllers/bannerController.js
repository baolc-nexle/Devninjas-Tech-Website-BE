import * as bannerService from "../services/bannerService.js";

// Lấy danh sách banner
export const getBanners = async (req, res) => {
  try {
    const { position } = req.query;
    const banners = await bannerService.getActiveBanners(position);
    
    res.status(200).json({
      success: true,
      message: "Lấy danh sách banner thành công",
      data: banners,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo banner mới
export const create = async (req, res) => {
  try {
    const newBanner = await bannerService.createBanner(req.body);
    res.status(201).json({
      success: true,
      message: "Tạo banner thành công",
      data: newBanner,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cập nhật banner
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBanner = await bannerService.updateBanner(id, req.body);
    res.status(200).json({
      success: true,
      message: "Cập nhật banner thành công",
      data: updatedBanner,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};