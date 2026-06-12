import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

  user.refreshToken = null;

  user.save();

  return true;
};
