import ProductVariantAttributeValue from "../models/ProductVariantAttributeValue.js";

export const createMany = async (
  variantId,
  attributeValueIds
) => {
  const data = attributeValueIds.map(
    (attributeValueId) => ({
      variantId,
      attributeValueId,
    })
  );

  return await ProductVariantAttributeValue.insertMany(
    data
  );
};

export const getByVariantId = async (
  variantId
) => {
  return await ProductVariantAttributeValue.find({
    variantId,
  })
    .populate({
      path: "attributeValueId",
      populate: {
        path: "attributeId",
      },
    });
};

export const deleteByVariantId = async (
  variantId
) => {
  return await ProductVariantAttributeValue.deleteMany({
    variantId,
  });
};