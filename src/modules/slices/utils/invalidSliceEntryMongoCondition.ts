const BSON_NUMBER_TYPES = ["double", "int", "long", "decimal"] as const;

export type InvalidSliceEntryVariableRoot = "e" | "entries";

export type SliceDataQuantityField = "stock" | "quantity";

/**
 * Mongo $expr / $filter cond для «невалидной» позиции в data среза.
 * Держать в sync с isInvalidSliceStockPriceItem.
 */
export function invalidSliceEntryMongoCondition(
  variableRoot: InvalidSliceEntryVariableRoot,
  stockOrQuantityField: SliceDataQuantityField
): Record<string, unknown> {
  const stockOrQuantity =
    variableRoot === "e"
      ? `$$e.v.${stockOrQuantityField}`
      : `$entries.v.${stockOrQuantityField}`;
  const price =
    variableRoot === "e" ? "$$e.v.price" : "$entries.v.price";

  const invalidPrice: Record<string, unknown> = {
    $or: [
      { $not: [{ $in: [{ $type: price }, [...BSON_NUMBER_TYPES]] }] },
      { $lt: [price, 0] },
      {
        $and: [
          { $in: [{ $type: price }, [...BSON_NUMBER_TYPES]] },
          { $not: [{ $eq: [price, price] }] },
        ],
      },
      { $eq: [price, { $literal: Infinity }] },
      { $eq: [price, { $literal: -Infinity }] },
    ],
  };

  return {
    $or: [
      {
        $and: [
          { $eq: [stockOrQuantity, -1] },
          { $eq: [price, -1] },
        ],
      },
      invalidPrice,
    ],
  };
}
