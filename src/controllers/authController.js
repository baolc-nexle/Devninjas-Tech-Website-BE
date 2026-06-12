import * as authService from "../services/authService.js";
export const register = async (req, res) => {
  try {
    const newUser = await authService.register(req.body);
    return res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (error) {
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
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Đã cấp token mới ",
      data: { accessToken: refreshToken.accessToken },
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
