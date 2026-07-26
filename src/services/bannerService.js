import Banner from "../models/Banner.js";

// Hàm con: Kiểm tra tính hợp lệ của banner
const validateBannerData = (data) => {
  if (!data.imageUrl || !data.position) {
    throw new Error("Thiếu thông tin bắt buộc: imageUrl hoặc position");
  }
};

// Hàm con: Tìm banner theo ID
const findBannerById = async (id) => {
  const banner = await Banner.findById(id);
  if (!banner) throw new Error("Banner không tồn tại");
  return banner;
};

// Hàm chính: Lấy danh sách (Business Logic riêng)
export const getActiveBanners = async (position) => {
  const now = new Date();
  return await Banner.find({
    isActive: true,
    position,
    $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }],
    $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }]
  }).sort({ displayOrder: 1 });
};

// Hàm chính: Tạo mới
export const createBanner = async (data) => {
  validateBannerData(data);
  
  const existing = await Banner.findOne({ slug: data.slug });
  if (existing) throw new Error("Slug banner đã tồn tại");

  return await Banner.create(data);
};

// Hàm chính: Cập nhật
export const updateBanner = async (id, data) => {
  const banner = await findBannerById(id);
  
  // Áp dụng thay đổi
  Object.assign(banner, data);
  return await banner.save();
};