import * as authControllers from "../controllers/authController.js";
import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", authControllers.register);

router.post("/login", authControllers.login);

router.post("/refreshToken", authControllers.getRefreshToken);

router.post("/logout", authMiddleWare, authControllers.logout);

router.get("/me", authMiddleWare, authControllers.getMe);

router.post("/forgot-password", authControllers.handleForgotPassword);

router.post("/verify-otp", authControllers.handleVerifyOTP); 

router.post("/reset-password", authControllers.handleResetPassword); 

router.post("/change-password", authMiddleWare, authControllers.handleChangePassword);

export default router;
