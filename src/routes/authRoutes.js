import * as authControllers from "../controllers/authController.js";
import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", authControllers.register);

router.post("/login", authControllers.login);

router.post("/refreshToken", authControllers.getRefreshToken);

router.post("/logout", authMiddleWare, authControllers.logout);

export default router;
