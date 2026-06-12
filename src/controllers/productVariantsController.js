import * as productVariantService from "../services/productVariantService.js";
import mongoose from "mongoose";
export const createVariant = async (req, res) => {
  try {
    // 1. Sao chép dữ liệu để tránh làm thay đổi trực tiếp req.body (best practice)
    const variantData = { ...req.body };

    console.log("--- [DEBUG] Incoming Variant Data ---");
    console.log("Payload:", variantData);

    // 2. Xử lý logic attributes (Parse JSON an toàn)
    if (variantData.attributes) {
      if (typeof variantData.attributes === "string") {
        try {
          variantData.attributes = JSON.parse(variantData.attributes);
        } catch (e) {
          console.warn(
            "⚠️ Attributes JSON parse failed, setting to empty object.",
          );
          variantData.attributes = {};
        }
      }
    }

    // 3. Xử lý File ảnh (Multer)
    if (req.file) {
      // Ưu tiên lấy path từ Cloudinary/S3 (nếu có), nếu không lấy filename local
      variantData.image = req.file.path || req.file.filename;
    }

    // 4. Ép kiểu Number an toàn (Tránh NaN nếu field bị trống hoặc sai định dạng)
    const numericFields = ["price", "stock", "compareAtPrice"];
    numericFields.forEach((field) => {
      if (variantData[field] !== undefined && variantData[field] !== "") {
        const parsedValue = Number(variantData[field]);
        variantData[field] = isNaN(parsedValue) ? 0 : parsedValue;
      }
    });

    // 5. Xử lý kiểu Boolean (Chống lỗi ép kiểu từ String của FormData)
    // Cách này bao quát cả: "true", true, "1", 1
    const toBoolean = (val) =>
      val === "true" || val === "1" || val === true || val === 1;

    variantData.isDefault = toBoolean(variantData.isDefault);
    variantData.isActive = toBoolean(variantData.isActive);

    // 6. [BỔ SUNG] Validate sơ bộ trước khi gọi Service (Fail-fast)
    if (!variantData.sku) {
      throw new Error("Mã SKU là bắt buộc.");
    }

    // 7. Gọi Service với dữ liệu đã "chuẩn hóa"
    const variant = await productVariantService.createVariant(variantData);

    return res.status(201).json({
      success: true,
      message: "Tạo biến thể thành công",
      data: variant,
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);

    // Xử lý lỗi trùng SKU (Thường gặp từ MongoDB/Mongoose)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Mã SKU này đã tồn tại, vui lòng kiểm tra lại.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi xử lý dữ liệu biến thể",
    });
  }
};

export const getVariantsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const variant = await productVariantService.getVariantsByProduct(productId);
    res.status(200).json({
      success: true,
      message: "lấy biến thể của sản phẩm thành công",
      data: variant,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getVariantById = async (req, res) => {
  try {
    const { variantId } = req.params;
    const variant = await productVariantService.getVariantById(variantId);
    res.status(200).json({
      success: true,
      message: "lấy biến thể thành công",
      data: variant,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { productId } = req.body; // Cần productId để tạo mới nếu chưa có

    // 1. Tạo bản sao và xử lý dữ liệu đầu vào
    let updateData = { ...req.body };

    if (updateData.attributes && typeof updateData.attributes === "string") {
      try {
        updateData.attributes = JSON.parse(updateData.attributes);
      } catch (e) {
        console.error("Lỗi khi parse attributes:", e);
      }
    }

    let result;

    // 2. KIỂM TRA: Đây là cập nhật hay thêm mới?
    // Nếu variantId không phải là ObjectId hợp lệ (ví dụ chuỗi "null", "undefined", hoặc "new-id")
    const isIdValid = mongoose.Types.ObjectId.isValid(variantId);

    if (isIdValid) {
      // TRƯỜNG HỢP 1: CẬP NHẬT (Giữ nguyên logic cũ của bạn)
      result = await productVariantService.updateVariant(variantId, updateData);
    } else {
      // TRƯỜNG HỢP 2: TẠO MỚI (Dành cho biến thể mới thêm khi đang sửa SP)
      // Kiểm tra điều kiện bắt buộc cho biến thể mới
      if (!productId) {
        throw new Error("Cần productId để tạo biến thể mới");
      }

      // Bạn có thể gọi service tạo mới ở đây
      // Đảm bảo data gửi đi có đủ các trường bắt buộc như sku, price, stock
      result = await productVariantService.createVariant({
        ...updateData,
        productId: productId,
      });
    }

    res.status(200).json({
      success: true,
      message: isIdValid
        ? "Cập nhật thành công"
        : "Thêm mới biến thể thành công",
      data: result,
    });
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const variant = await productVariantService.deleteVariant(variantId);
    res.status(200).json({
      success: true,
      message: "xóa biến thể thành công",
      data: variant,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
