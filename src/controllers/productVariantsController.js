import * as productVariantService from "../services/productVariantService.js";
import mongoose from "mongoose";
export const createVariant = async (req, res) => {
  // 1. Kiểm tra toàn bộ body (text fields)
  console.log("--- Body nhận được ---");
  console.log(JSON.stringify(req.body, null, 2));

  // 2. Kiểm tra danh sách file nhận được
  console.log("--- Files nhận được ---");
  console.log(req.files); // Nếu dùng upload.any() hoặc upload.fields()
  console.log(req.file);  // Nếu dùng upload.single()
  try {
    // 1. Lấy danh sách biến thể (hoặc tạo mảng chứa 1 phần tử nếu chỉ có dữ liệu đơn)
    const variantsList = Array.isArray(req.body.variants) 
      ? req.body.variants 
      : [{ ...req.body }]; // Fallback nếu không phải mảng variants

    // Xử lý tất cả các biến thể
    const createdVariants = await Promise.all(variantsList.map(async (v) => {
      // Clone dữ liệu từ phần tử trong mảng
      let variantData = { ...v, productId: req.body.productId };

      // 2. Xử lý logic attributes
      if (variantData.attributeValueIds) {
        if (typeof variantData.attributeValueIds === "string") {
          try {
            variantData.attributeValueIds = JSON.parse(variantData.attributeValueIds);
          } catch (e) {
            throw new Error("attributeValueIds không đúng định dạng");
          }
        }
      } else if (variantData.attributes) {
        variantData.attributeValueIds = variantData.attributes;
      }

     if (req.files && req.files.length > 0) {
      // Tìm file tương ứng dựa trên imageIndex mà bạn đã gửi từ client
      // Lưu ý: v.imageIndex phải được truyền đúng từ client
      const fileIndex = parseInt(v.imageIndex); 
      const uploadedFile = req.files.find(f => f.originalname === v.imageName || (fileIndex !== NaN && req.files[fileIndex]));
      
      // Hoặc đơn giản hơn nếu bạn biết chắc chắn thứ tự:
      const foundFile = req.files[fileIndex]; 
      
      if (foundFile) {
        variantData.image = foundFile.path || foundFile.filename;
      }
    }

      // 4. Ép kiểu Number an toàn
      const numericFields = ["price", "stock", "compareAtPrice"];
      numericFields.forEach((field) => {
        if (variantData[field] !== undefined && variantData[field] !== "") {
          const parsedValue = Number(variantData[field]);
          variantData[field] = isNaN(parsedValue) ? 0 : parsedValue;
        }
      });

      // 5. Xử lý kiểu Boolean
      const toBoolean = (val) =>
        val === "true" || val === "1" || val === true || val === 1;

      variantData.isDefault = toBoolean(variantData.isDefault);
      variantData.isActive = toBoolean(variantData.isActive);

      // 6. Validate
      if (!variantData.sku) {
        throw new Error("Mã SKU là bắt buộc.");
      }

      // 7. Gọi Service
      return await productVariantService.createVariant({
        ...variantData,
        attributes: variantData.attributeValueIds
      });
    }));

    return res.status(201).json({
      success: true,
      message: `Tạo ${createdVariants.length} biến thể thành công`,
      data: createdVariants,
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);

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
    const variants = await productVariantService.getVariantsByProduct(productId);
    res.status(200).json({
      success: true,
      message: "lấy biến thể của sản phẩm thành công",
      data: variants,
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
  // LOG ĐỂ KIỂM TRA ĐÚNG CHÍNH XÁC
  console.log("--- DEBUG ---");
  console.log("req.body hiện tại:", JSON.stringify(req.body, null, 2));
  console.log("req.params:", req.params);
  console.log("req.files:", req.files);
  
  try {
    const { variantId } = req.params;
    
    // SỬA LỖI TẠI ĐÂY: Dùng toán tử ?. để tránh văng lỗi nếu req.body là undefined
    // Hoặc nếu req.body là undefined, lấy productId từ req.params hoặc một cách khác
    const productId = req.body?.productId || req.params.productId; 

    if (!productId) {
        // Nếu vẫn không có, trả về lỗi rõ ràng thay vì văng exception
        return res.status(400).json({ 
            success: false, 
            message: "Không nhận được dữ liệu productId, hãy kiểm tra FormData" 
        });
    }
    // 2. TẠO BẢN SAO VÀ XỬ LÝ ẢNH TỪ REQ.FILES
    let updateData = { ...req.body };
    const files = req.files || [];

    // Nếu có file ảnh được gửi lên, gán nó vào updateData
    // Giả sử bạn gửi index qua 'imageIndex' để biết ảnh thuộc về biến thể nào
    if (files.length > 0 && updateData.imageIndex !== undefined) {
      const file = files[parseInt(updateData.imageIndex)];
      if (file) {
        updateData.image = file.path || file.filename;
      }
    }

    // 3. XỬ LÝ ATTRIBUTES
    if (updateData.attributeValueIds && typeof updateData.attributeValueIds === "string") {
      try {
        updateData.attributeValueIds = JSON.parse(updateData.attributeValueIds);
      } catch (e) {
        throw new Error("attributeValueIds không đúng định dạng");
      }
    }

    let result;
    const isIdValid = mongoose.Types.ObjectId.isValid(variantId);
    
    // --- DEBUG LOGIC VÀ ID ---
    console.log("--- DEBUG LOGIC ---");
    console.log("VariantID truyền vào từ params:", variantId);
    console.log("isIdValid (kiểm tra ObjectId):", isIdValid);
    console.log("updateData sẽ gửi vào Service:", updateData);

    // 4. LOGIC CẬP NHẬT HOẶC TẠO MỚI
    if (isIdValid) {
      result = await productVariantService.updateVariant(variantId, updateData);
      
      // DEBUG: Kiểm tra service trả về gì
      console.log("Kết quả từ Service (update):", result);
      if (!result) {
        console.error("LỖI: Service update trả về null cho ID:", variantId);
        throw new Error("Variant không tồn tại");
      }
    } else {
      console.log("Thực hiện tạo mới biến thể...");
      result = await productVariantService.createVariant({
        ...updateData,
        productId: productId,
      });
    }

    res.status(200).json({
      success: true,
      message: isIdValid ? "Cập nhật thành công" : "Thêm mới biến thể thành công",
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
