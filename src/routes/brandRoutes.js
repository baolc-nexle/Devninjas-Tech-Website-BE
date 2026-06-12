import express from "express";
import * as brandController from "../controllers/brandController.js";

const router = express.Router();

// CREATE
router.post("/", brandController.createBrand);

// GET ALL
router.get("/", brandController.getAllBrands);

// GET BY ID
router.get("/:id", brandController.getBrandById);

// UPDATE
router.put("/:id", brandController.updateBrand);

// DELETE
router.delete("/:id", brandController.deleteBrand);

export default router;
