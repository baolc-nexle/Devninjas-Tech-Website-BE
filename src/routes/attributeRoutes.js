import express from "express";
import * as attributeController from "../controllers/attributeController.js";

const router = express.Router();

router.get("/", attributeController.getAllAttributes);

router.get("/:id", attributeController.getAttributeById);

router.post("/", attributeController.createAttribute);

router.put("/:id", attributeController.updateAttribute);

router.delete("/:id", attributeController.deleteAttribute);

export default router;