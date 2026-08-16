/** Колонки Excel: `key` = поле модели, `header` = подпись первой строки (править здесь). */
export const GRABO_SKU_EXCEL_COLUMNS = [
  { key: "productId", header: "ID" },
  { key: "title", header: "Назва" },
  { key: "url", header: "URL" },
  { key: "isNewProduct", header: "Новинка" },
  { key: "color", header: "Колір" },
  { key: "size", header: "Розмір" },
  { key: "material", header: "Матеріал" },
  { key: "gas", header: "Газ" },
  { key: "language", header: "Мова" },
  { key: "gasCapacity", header: "Об'єм газу" },
  { key: "tags", header: "Теги" },
  { key: "images", header: "Зображення" },
  { key: "isOnSite", header: "На сайті" },
  { key: "lastSeenAt", header: "Остання поява" },
  { key: "createdAt", header: "Створено" },
  { key: "updatedAt", header: "Оновлено" },
] as const;

export type GraboSkuExcelColumn = (typeof GRABO_SKU_EXCEL_COLUMNS)[number];
export type GraboSkuExcelColumnKey = GraboSkuExcelColumn["key"];
