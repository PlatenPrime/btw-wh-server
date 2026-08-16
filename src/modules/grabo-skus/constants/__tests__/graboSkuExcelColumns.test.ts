import { describe, expect, it } from "vitest";
import { GRABO_SKU_EXCEL_COLUMNS } from "../graboSkuExcelColumns.js";

describe("GRABO_SKU_EXCEL_COLUMNS", () => {
  it("maps model field keys without mongo id", () => {
    expect(GRABO_SKU_EXCEL_COLUMNS.map((col) => col.key)).toEqual([
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
    ]);
    expect(GRABO_SKU_EXCEL_COLUMNS.map((col) => col.key)).not.toContain("_id");
    expect(GRABO_SKU_EXCEL_COLUMNS.map((col) => col.key)).not.toContain("__v");
  });

  it("exposes editable Ukrainian headers", () => {
    expect(GRABO_SKU_EXCEL_COLUMNS.map((col) => col.header)).toEqual([
      "ID",
      "Назва",
      "URL",
      "Новинка",
      "Колір",
      "Розмір",
      "Матеріал",
      "Газ",
      "Мова",
      "Об'єм газу",
      "Теги",
      "Зображення",
      "На сайті",
      "Остання поява",
      "Створено",
      "Оновлено",
    ]);
  });
});
