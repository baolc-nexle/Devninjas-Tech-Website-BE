import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

export const register = async (data) => {
  // step 1: nhận dữ liệu từ request (thêm confirmPassword và agreeTerms)
  let { name, email, password, confirmPassword, phone, agreeTerms } = data;

  // step 2: trim() dữ liệu
  name = name?.trim();
  email = email?.trim().toLowerCase();
  password = password.trim();
  confirmPassword = confirmPassword?.trim();
  phone = phone?.trim();

  // step 3: kiểm tra field không được để trống (thêm check confirmPassword)
  if (!name || !email || !password || !confirmPassword || !phone) {
    throw new Error("Vui lòng nhập đầy đủ thông tin (không được để trống)");
  }

  // Bổ sung: Kiểm tra checkbox đồng ý điều khoản
  if (agreeTerms !== true) {
    throw new Error("Bạn cần đồng ý với điều khoản sử dụng và chính sách bảo mật");
  }

  // Bổ sung: Kiểm tra mật khẩu khớp nhau
  if (password !== confirmPassword) {
    throw new Error("Mật khẩu xác nhận không khớp");
  }

  // step 4: kiểm tra email đúng định dạng
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Email không đúng định dạng");
  }

  // Kiểm tra định dạng phone
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error("Số điện thoại không đúng định dạng (10-11 số)");
  }

  // step 5: Kiểm tra độ mạnh của password
  if (password.length < 8) {
    throw new Error("Mật khẩu phải lớn hơn hoặc bằng 8 ký tự");
  }

  // step 6: kiểm tra email HOẶC phone có tồn tại không
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    throw new Error("Email hoặc số điện thoại đã tồn tại");
  }

  // step 7: Hash password
  const hashPassword = await bcrypt.hash(password, 10);

  // step 8: tạo user mới
  const newUser = await User.create({ 
    name, 
    email, 
    password: hashPassword, 
    phone 
  });

  // step 9: không trả về password
  const userResult = newUser.toObject();
  userResult.password = undefined;

  // step 10: trả về user mới
  return userResult;
};

export const login = async (data) => {
  // step 1: Lấy dữ liệu từ FE
  const { email, password } = data;

  // step 2: validate email, password không được rỗng
  if (!email || !password) {
    throw new Error("Vui lòng nhập đủ thông tin ");
  }

  // step 3: tìm user có email này
  const user = await User.findOne({ email });

  // step 4: check user có tồn tại
  if (!user) {
    throw new Error("User không tồn tại");
  }

  // --- BỔ SUNG: Kiểm tra trạng thái Block ---
  if (user.status === 'block') {
    throw new Error("Tài khoản của bạn đã bị khóa, vui lòng liên hệ Admin!");
  }

  // step 5: so sánh password có khớp với password ở db
  const isMatch = await bcrypt.compare(password, user.password);

  // step 6: check password có giống không
  if (!isMatch) {
    throw new Error("Sai Mật khẩu");
  }

  // step 7: tạo jwt token access token
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "secret_key",
    { expiresIn: "1h" },
  );

  // step 8: tạo refresh token
  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.REFRESH_SECRET || "refresh_secret_key",
    { expiresIn: "2d" },
  );

  // step 9: lưu refresh token vào db
  user.refreshToken = refreshToken;
  await user.save();

  //step 10: không trả về password cho json để tránh bị hack (json tự động bỏ qua các giá trị undefined)
  user.password = undefined;

  // step 11: trả về user kèm theo token
  return { user, accessToken, refreshToken };
};

// gửi yêu cầu cấp token mới khi access token hết hạn, refresh token vẫn còn hạn
export const getRefreshToken = async (refreshToken) => {
  // step 1: kiểm tra refreshToken có tồn tại không
  if (!refreshToken) {
    throw new Error("refreshToken không tồn tại");
  }

  // step 2: giải mã jwt có nghĩa là decode tương đương với userID
  const decode = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

  // step 3: dùng đoạn jwt đã giải mã đó và tìm đến user có trong db
  const user = await User.findById(decode.id);
  if (!user) {
    throw new Error("User không tồn tại");
  }

  // step 4: so sánh refreshToken truyền vào từ FE có giống với refreshToken trong db
  if (user.refreshToken !== refreshToken) {
    throw new Error("Refresh token không hợp lệ");
  }

  // step 5: tạo access token mới
  const newAccessToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  // step 6: tạo refresh token mới
  const newRefreshToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.REFRESH_SECRET,
    { expiresIn: "1d" },
  );

  // step 7: lưu lại vào db
  user.refreshToken = newRefreshToken;
  await user.save();

  // step 8: trả về access token mới
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// logout: xóa refresh token trong db khi user logout
export const logout = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User không tồn tại");
  }

  // Cập nhật refreshToken về null
  user.refreshToken = null;

  // BỔ SUNG: Thêm await ở đây để đảm bảo lưu dữ liệu hoàn tất
  await user.save(); 

  return true;
};

export const getMe = async (id) => {
  const user = await User.findById(id).select("-password"); // .select("-password") là cách nhanh nhất để loại bỏ mật khẩu ngay từ truy vấn DB
  
  if (!user) {
    throw new Error("User không tồn tại");
  }

  return user;
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Luôn trả về thông báo chung để bảo mật
  if (!user) return { message: "Nếu email tồn tại, mã xác thực đã được gửi." };

  // 1. Tạo mã OTP ngẫu nhiên 6 chữ số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Lưu OTP vào DB (Đảm bảo Schema của bạn đã có field resetPasswordOTP)
  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // Hết hạn sau 5 phút
  await user.save();

  // 3. Nội dung email chứa OTP
  const htmlContent = `
    <h2>Xác thực tài khoản</h2>
    <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
    <p>Mã xác thực của bạn là: <strong>${otp}</strong></p>
    <p>Mã này có hiệu lực trong vòng 5 phút.</p>
  `;

  // 4. Gửi email
  await sendEmail(user.email, "Mã xác thực đặt lại mật khẩu", htmlContent);

  return { message: "Mã xác thực đã được gửi tới email của bạn." };
};

export const verifyOTP = async (email, otp) => {
  const user = await User.findOne({ 
    email, 
    resetPasswordOTP: otp,
    resetPasswordExpires: { $gt: Date.now() } // Kiểm tra thời hạn
  });

  if (!user) {
    throw new Error("Mã OTP không đúng hoặc đã hết hạn.");
  }

  return { message: "Xác thực thành công. Vui lòng nhập mật khẩu mới." };
};

export const resetPassword = async (email, newPassword) => {
  // Tìm user theo email
  const user = await User.findOne({ email });
  
  // Kiểm tra nếu user không tồn tại hoặc đã mất dữ liệu OTP (tức là chưa qua Step 2)
  if (!user || !user.resetPasswordOTP) {
    throw new Error("Yêu cầu không hợp lệ. Vui lòng thực hiện xác thực OTP trước.");
  }

  // Cập nhật mật khẩu mới
  user.password = await bcrypt.hash(newPassword, 10);

  // Xóa OTP và thời hạn sau khi đổi xong để bảo mật
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
  return { message: "Đổi mật khẩu thành công." };
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  // 1. Tìm user theo ID (lấy từ token đã đăng nhập)
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại.");

  // 2. Kiểm tra mật khẩu cũ
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Mật khẩu cũ không chính xác.");

  // 3. Hash mật khẩu mới và lưu
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: "Đổi mật khẩu thành công." };
};
