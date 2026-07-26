import express from "express";
import * as attributeValueController from "../controllers/attributeValueController.js";

const router = express.Router();

router.get(
  "/",
  attributeValueController.getAllAttributeValues
);

router.get(
  "/attribute/:attributeId",
  attributeValueController.getValuesByAttribute
);

router.get(
  "/:id",
  attributeValueController.getAttributeValueById
);

router.post(
  "/",
  attributeValueController.createAttributeValue
);

router.put(
  "/:id",
  attributeValueController.updateAttributeValue
);

router.delete(
  "/:id",
  attributeValueController.deleteAttributeValue
);

export default router;