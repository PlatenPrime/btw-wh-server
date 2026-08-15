import { beforeEach, describe, expect, it, vi } from "vitest";
import { sleep } from "../../../browser/utils/sleep.js";
import type { GraboSkuData } from "../../../browser/grabo/utils/types/graboSkuData.js";
import { GraboSku } from "../../models/GraboSku.js";
import { runGraboSkuSyncUtil } from "../runGraboSkuSyncUtil.js";

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("../../../browser/utils/sleep.js", () => ({
  sleep: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../../../logging/createLogger.js", () => ({
  createLogger: () => mockLogger,
}));

const URL_A = "https://www.grabo-balloons.com/en/ga-balloon-a";
const URL_B = "https://www.grabo-balloons.com/en/gb-balloon-b";
const URL_GONE = "https://www.grabo-balloons.com/en/gg-balloon-gone";

function skuData(productId: string, title: string): GraboSkuData {
  return {
    title,
    productId,
    isNew: false,
    color: "Red",
    size: "M",
    material: "Foil",
    gas: "Helium",
    language: "",
    gasCapacity: "",
    tag: [],
    images: [],
  };
}

describe("runGraboSkuSyncUtil", () => {
  beforeEach(async () => {
    await GraboSku.deleteMany({});
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
  });

  it("creates and updates by productId", async () => {
    await GraboSku.create({
      title: "Old A",
      productId: "GA",
      url: URL_A,
      isOnSite: true,
      lastSeenAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const stats = await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [URL_A, URL_B],
        failedCategoryUrls: [],
      }),
      getSkuData: async (url) =>
        url === URL_A ? skuData("GA", "New A") : skuData("GB", "B"),
      delayMs: () => 0,
      now: () => new Date("2026-08-15T00:00:00.000Z"),
    });

    expect(stats).toMatchObject({
      listed: 2,
      created: 1,
      updated: 1,
      errors: 0,
      catalogComplete: true,
    });
    expect((await GraboSku.findOne({ productId: "GA" }).lean())?.title).toBe(
      "New A"
    );
    expect(await GraboSku.countDocuments()).toBe(2);
  });

  it("marks off-site only urls missing from listing when catalog is complete", async () => {
    await GraboSku.create({
      title: "Gone",
      productId: "GG",
      url: URL_GONE,
      isOnSite: true,
      lastSeenAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const stats = await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [URL_A],
        failedCategoryUrls: [],
      }),
      getSkuData: async () => skuData("GA", "A"),
      delayMs: () => 0,
    });

    expect(stats.markedOffSite).toBe(1);
    expect(
      (await GraboSku.findOne({ productId: "GG" }).lean())?.isOnSite
    ).toBe(false);
  });

  it("does not absent-pass when a category crawl failed", async () => {
    await GraboSku.create({
      title: "Gone",
      productId: "GG",
      url: URL_GONE,
      isOnSite: true,
      lastSeenAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const stats = await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [URL_A],
        failedCategoryUrls: ["https://www.grabo-balloons.com/en/street"],
      }),
      getSkuData: async () => skuData("GA", "A"),
      delayMs: () => 0,
    });

    expect(stats.catalogComplete).toBe(false);
    expect(stats.markedOffSite).toBe(0);
    expect(
      (await GraboSku.findOne({ productId: "GG" }).lean())?.isOnSite
    ).toBe(true);
  });

  it("does not flip isOnSite when product fetch fails", async () => {
    await GraboSku.create({
      title: "A",
      productId: "GA",
      url: URL_A,
      isOnSite: true,
      lastSeenAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const stats = await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [URL_A],
        failedCategoryUrls: [],
      }),
      getSkuData: async () => {
        throw new Error("timeout");
      },
      delayMs: () => 0,
    });

    expect(stats.errors).toBe(1);
    expect(stats.markedOffSite).toBe(0);
    expect(
      (await GraboSku.findOne({ productId: "GA" }).lean())?.isOnSite
    ).toBe(true);
  });

  it("does not absent-pass when listed urls are empty", async () => {
    await GraboSku.create({
      title: "Gone",
      productId: "GG",
      url: URL_GONE,
      isOnSite: true,
      lastSeenAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const stats = await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [],
        failedCategoryUrls: [],
      }),
      getSkuData: async () => skuData("GA", "A"),
      delayMs: () => 0,
    });

    expect(stats.catalogComplete).toBe(true);
    expect(stats.markedOffSite).toBe(0);
    expect(
      (await GraboSku.findOne({ productId: "GG" }).lean())?.isOnSite
    ).toBe(true);
  });

  it("skips empty productId", async () => {
    const stats = await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [URL_A],
        failedCategoryUrls: [],
      }),
      getSkuData: async () => skuData("   ", "Empty"),
      delayMs: () => 0,
    });

    expect(stats.skippedNoProductId).toBe(1);
    expect(await GraboSku.countDocuments()).toBe(0);
  });

  it("jitters between product fetches, not before the first", async () => {
    vi.mocked(sleep).mockClear();

    await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [URL_A, URL_B],
        failedCategoryUrls: [],
      }),
      getSkuData: async (url) =>
        url === URL_A ? skuData("GA", "A") : skuData("GB", "B"),
      delayMs: () => 11,
    });

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(11);
  });

  it("logs catalog and per-product progress", async () => {
    await runGraboSkuSyncUtil({
      collectCatalog: async () => ({
        categoryUrls: ["https://www.grabo-balloons.com/en/party"],
        productUrls: [URL_A, URL_B],
        failedCategoryUrls: [],
      }),
      getSkuData: async (url) =>
        url === URL_A ? skuData("GA", "A") : skuData("GB", "B"),
      delayMs: () => 0,
    });

    expect(mockLogger.info).toHaveBeenCalledWith("grabo sku sync started");
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ listed: 2, catalogComplete: true }),
      "grabo sku catalog collected"
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 1,
        total: 2,
        productId: "GA",
        result: "created",
      }),
      "grabo sku product"
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ listed: 2 }),
      "grabo sku absent-pass start"
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ listed: 2 }),
      "grabo sku sync finished"
    );
  });
});
