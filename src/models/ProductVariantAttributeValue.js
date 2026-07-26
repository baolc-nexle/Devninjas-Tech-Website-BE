import mongoose from "mongoose";

const productVariantAttributeValueSchema =
  new mongoose.Schema(
    {
      variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true,
      },

      attributeValueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttributeValue",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "ProductVariantAttributeValue",
  productVariantAttributeValueSchema
);