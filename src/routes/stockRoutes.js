import express from "express";

import * as stockController from "../controllers/stockController.js";

const router = express.Router();

/* =========================
        STOCK ROUTES
========================= */

// check stock
router.post("/check", stockController.checkStock);

// validate cart stock
router.post("/validate-cart", stockController.validateCartStock);

// reserve stock
router.post("/reserve", stockController.reserveStock);

// release stock
router.post("/release", stockController.releaseStock);

// decrease stock (checkout success)
router.post("/decrease", stockController.decreaseStock);

// increase stock (refund / cancel)
router.post("/increase", stockController.increaseStock);

export default router;
