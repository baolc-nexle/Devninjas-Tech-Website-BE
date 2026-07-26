import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: Number,
    },

    // Trường ngày sinh mới được bổ sung
    birthday: {
      type: Date,
      default: null, // Mặc định là null khi mới đăng ký
    },

    address: {
      type: String,
    },

    // Trường avatar mới được bổ sung
    avatar: {
      type: String,
      default: "", // Có thể để chuỗi trống hoặc gán link ảnh mặc định nếu muốn
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    refreshToken: {
      type: String,
      default: null,
    },

    // Trường giới tính mới được bổ sung
    gender: {
      type: String,
      enum: ["male", "female", "other", ""], // Các giá trị cho phép
      default: "", // Hoặc có thể bỏ trống mặc định
    },

    status: {
      type: String,
      enum: ["active", "block"],
      default: "active",
    },
    resetPasswordOTP: String,
    
    resetPasswordExpires: Date,
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
