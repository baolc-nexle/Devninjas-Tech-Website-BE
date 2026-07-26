import express from "express";
import * as bannerController from "../controllers/bannerController.js";

const router = express.Router();

// GET /api/banners?position=homepage
router.get("/", bannerController.getBanners);

// POST /api/banners
router.post("/", bannerController.create);

// PUT /api/banners/:id
router.put("/:id", bannerController.update);

export default router;