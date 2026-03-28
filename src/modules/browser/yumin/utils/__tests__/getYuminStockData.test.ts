import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractPieceCountFromTitle,
  getYuminStockData,
  parseYuminProductHtml,
} from "../getYuminStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";

vi.mock("../../../utils/browserRequest.js");

const thisDir = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(thisDir, "..", "..");

function loadYuminFixture(filename: string): string {
  const raw = readFileSync(join(fixtureDir, filename), "utf-8");
  const doctype = raw.indexOf("<!DOCTYPE");
  const seo = raw.search(/<!--\s*SEO/i);
  const start =
    doctype >= 0 ? doctype : seo >= 0 ? seo : 0;
  return raw.slice(start);
}

describe("extractPieceCountFromTitle", () => {
  it("достаёт N из скобок (Nшт)", () => {
    expect(extractPieceCountFromTitle('Товар (100шт)')).toBe(100);
    expect(extractPieceCountFromTitle("Товар (10 шт)")).toBe(10);
  });

  it("возвращает null без шаблона", () => {
    expect(extractPieceCountFromTitle("Blue Petrol (УП)")).toBeNull();
  });
});

describe("parseYuminProductHtml", () => {
  it("clean_price: нормализация на штуки (10шт)", () => {
    const html = loadYuminFixture("clean_price.txt");
    const result = parseYuminProductHtml(html);
    expect(result).toMatchObject({
      stock: 150,
      price: 13.84,
    });
    expect(result.title).toContain("10шт");
  });

  it("pack_price: нормализация на штуки (100шт)", () => {
    const html = loadYuminFixture("pack_price.txt");
    const result = parseYuminProductHtml(html);
    expect(result).toMatchObject({
      stock: 1300,
      price: 1.71,
    });
  });

  it("sale_price: без (Nшт) в названии — цена и остаток как на странице", () => {
    const html = loadYuminFixture("sale_price.txt");
    const result = parseYuminProductHtml(html);
    expect(result).toMatchObject({
      stock: 10,
      price: 18.94,
    });
  });

  it("wholesale_price: учёт опта «Від X шт.»", () => {
    const html = loadYuminFixture("wholesale_price.txt");
    const result = parseYuminProductHtml(html);
    expect(result).toMatchObject({
      stock: 88358,
      price: 1.57,
    });
  });

  it("zero_stock: flat-qty 0", () => {
    const html = loadYuminFixture("zero_stock.txt");
    const result = parseYuminProductHtml(html);
    expect(result).toMatchObject({
      stock: 0,
      price: 89.46,
    });
  });

  it("возвращает -1,-1 без v-product-customizable-options", () => {
    const html = "<html><body><h1 class='text-3xl'>X (10шт)</h1></body></html>";
    expect(parseYuminProductHtml(html)).toEqual({ stock: -1, price: -1 });
  });

  it("возвращает -1,-1 при пустом HTML", () => {
    expect(parseYuminProductHtml("")).toEqual({ stock: -1, price: -1 });
  });
});

describe("getYuminStockData", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
  });

  describe("Валидация входных данных", () => {
    it("должен выбрасывать ошибку при пустой ссылке", async () => {
      await expect(getYuminStockData("")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при null", async () => {
      await expect(
        getYuminStockData(null as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при undefined", async () => {
      await expect(
        getYuminStockData(undefined as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при не-строковом link", async () => {
      await expect(
        getYuminStockData(123 as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });
  });

  it("должен возвращать -1,-1 при ошибке сети", async () => {
    vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
    const result = await getYuminStockData("https://example.com/p");
    expect(result).toEqual({ stock: -1, price: -1 });
  });

  it("должен парсить ответ browserGet", async () => {
    const html = loadYuminFixture("clean_price.txt");
    vi.mocked(browserGet).mockResolvedValue(html);
    const result = await getYuminStockData("https://yumi.market/test");
    expect(result.stock).toBe(150);
    expect(result.price).toBe(13.84);
  });
});
