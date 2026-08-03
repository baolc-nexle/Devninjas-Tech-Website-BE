import * as authService from "../services/authService.js";
export const register = async (req, res) => {
  try {
    const newUser = await authService.register(req.body);
    return res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    // ID được lấy từ middleware xác thực (thường là req.user.id)
    const userId = req.user.id; 
    const user = await authService.getMe(userId);
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 2. Lưu Access Token vào Cookie (Cookie thứ hai)
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true, // Không cho JS đọc
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000, // 1 giờ
    });

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (error) {
    // Kiểm tra lỗi bị khóa tài khoản
    if (error.message.includes("khóa") || error.message.includes("block")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    // Các lỗi khác (sai pass, user không tồn tại)
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    const result = await authService.getRefreshToken(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Đã cấp token mới ",
      data: { accessToken: result.accessToken },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await authService.logout(userId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json({ success: true, message: "Logout thành công" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller cho Step 2
export const handleVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller cho Step 3
export const handleResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const result = await authService.resetPassword(email, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const handleChangePassword = async (req, res) => {
  try {
    // Sửa chỗ này: Lấy .id chứ không phải .userId
    const userId = req.user.id; 
    const { oldPassword, newPassword } = req.body;

    // Kiểm tra xem ID có tồn tại không trước khi gọi service
    if (!userId) {
      return res.status(401).json({ message: "Token không chứa thông tin user" });
    }

    const result = await authService.changePassword(userId, oldPassword, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};