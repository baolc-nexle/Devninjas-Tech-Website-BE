import FlashSale from "../models/Flashsale.js";
import mongoose from "mongoose";

const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("ID không hợp lệ");
};

export const getAllFlashSales = async () => {
  return await FlashSale.find().sort({ createdAt: -1 });
};

export const createFlashSale = async (data) => {
  // Logic validate thời gian
  if (new Date(data.startTime) >= new Date(data.endTime)) {
    throw new Error("Thời gian bắt đầu phải trước thời gian kết thúc");
  }
  return await FlashSale.create(data);
};

export const getFlashSaleById = async (id) => {
  validateId(id);
  const flashSale = await FlashSale.findById(id);
  if (!flashSale) throw new Error("Không tìm thấy chiến dịch");
  return flashSale;
};

export const getFlashSalesByDate = async (date) => {
  // 'date' ở đây truyền vào là '2026-06-22'
  
  // Tạo mốc bắt đầu ngày và kết thúc ngày bằng chuỗi ISO
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  return await FlashSale.find({
    startTime: { 
      $gte: startOfDay, 
      $lte: endOfDay 
    }
  }).sort({ startTime: 1 }); 
};

export const toggleFlashSaleStatus = async (id, isActive) => {
  validateId(id);
  return await FlashSale.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  );
};