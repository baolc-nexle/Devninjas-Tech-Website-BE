import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    // Khóa ngoại liên kết tới bảng User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Họ và tên người nhận tại địa chỉ này
    fullname: {
      type: String,
      required: true,
    },

    // Số điện thoại người nhận
    phone: {
      type: String,
      required: true,
    },

    // Tỉnh / Thành phố
    province: {
      type: String,
      required: true,
    },

    // Quận / Huyện
    district: {
      type: String,
      required: true,
    },

    // Phường / Xã
    ward: {
      type: String,
      required: true,
    },

    // Địa chỉ chi tiết (Số nhà, tên đường,...)
    detail: {
      type: String,
      required: true,
    },

    // Tên gợi nhớ (Ví dụ: Nhà riêng, Công ty,...)
    addressName: {
      type: String,
      default: "",
    },

    // Loại địa chỉ (Ví dụ: Nhà, Văn phòng)
    addressType: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home",
    },

    // Đánh dấu có phải địa chỉ mặc định hay không
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Address = mongoose.model("Address", addressSchema);

export default Address;