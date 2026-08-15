/** Заголовки Excel = имена полей модели GraboSku без _id / __v. */
export const GRABO_SKU_EXCEL_COLUMNS = [
  "productId",
  "title",
  "url",
  "isNewProduct",
  "color",
  "size",
  "material",
  "gas",
  "language",
  "gasCapacity",
  "tags",
  "images",
  "isOnSite",
  "lastSeenAt",
  "createdAt",
  "updatedAt",
] as const;

export type GraboSkuExcelColumn = (typeof GRABO_SKU_EXCEL_COLUMNS)[number];
