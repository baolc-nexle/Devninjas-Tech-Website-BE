import * as VoucherService from "../services/voucher.js";

// 1. Admin: Tạo voucher mới
export const createVoucher = async (req, res) => {
  try {
    const voucher = await VoucherService.createVoucher(req.body);
    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await VoucherService.getAllVouchers();

        res.status(200).json({
            success: true,
            data: vouchers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateVoucher = async (req, res) => {
    try {
        const voucher = await VoucherService.updateVoucher(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            data: voucher,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteVoucher = async (req, res) => {
    try {
        await VoucherService.deleteVoucher(req.params.id);

        res.json({
            success: true,
            message: "Xóa thành công",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// 2. User: Kiểm tra mã (Validate)
export const validateVoucher = async (req, res) => {
  try {
    const { voucherCode, orderId } = req.body;
    const userId = req.user.id; // Giả sử đã có middleware xác thực user
    const voucher = await VoucherService.validateVoucher(voucherCode, orderId, userId);
    res.status(200).json({ success: true, data: voucher });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 3. User: Áp dụng voucher
export const applyVoucher = async (req, res) => {
  try {
    console.log("DEBUG: Đã vào tới Controller");
    const { voucherCode, orderId } = req.body;
    const userId = req.user.id;
    console.log("User ID:", userId);
    const result = await VoucherService.applyVoucher(voucherCode, orderId, userId);
    res.status(200).json({ success: true, message: "Áp dụng voucher thành công", data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. User: Gỡ voucher (Reverse)
export const removeVoucher = async (req, res) => {
  try {
    const { voucherId, orderId } = req.body;
    const result = await VoucherService.reverseVoucher(voucherId, orderId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy danh sách voucher người dùng có thể sử dụng
export const getAvailableVouchers = async (req, res) => {
  try {
    // Lấy giá trị đơn hàng từ query string, mặc định là 0
    const orderValue = Number(req.query.orderValue) || 0;
    
    const vouchers = await VoucherService.getAvailableVouchers(orderValue);
    
    res.status(200).json({ 
      success: true, 
      count: vouchers.length,
      data: vouchers 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};