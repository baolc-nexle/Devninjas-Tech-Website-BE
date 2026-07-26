import express from "express";
import * as productVariantController from "../controllers/productVariantsController.js";
import createUploader from "../middlewares/uploadMiddleware.js";
const router = express.Router();

const uploadVariant = createUploader("variants");
// create variant
router.post(
  "/",
  uploadVariant.any(),
  productVariantController.createVariant,
);

// get variants by product
router.get(
  "/product/:productId",
  productVariantController.getVariantsByProduct,
);

// get variant by id
router.get(
  "/:variantId",
  uploadVariant.single("image"),
  productVariantController.getVariantById,
);

// update variant
router.put(
  "/:variantId",
  uploadVariant.any(),
  productVariantController.updateVariant,
);

// delete variant (soft delete)
router.delete("/:variantId", productVariantController.deleteVariant);

export default router;
