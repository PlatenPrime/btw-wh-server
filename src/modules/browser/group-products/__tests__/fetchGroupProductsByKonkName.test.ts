import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchGroupProductsByKonkName,
  UnsupportedKonkForGroupProductsError,
} from "../fetchGroupProductsByKonkName.js";

vi.mock("../../air/group-pages/utils/getAirGroupPagesProducts.js", () => ({
  getAirGroupPagesProducts: vi.fn(),
}));
vi.mock("../../balun/group-pages/utils/getBalunGroupPagesProducts.js", () => ({
  getBalunGroupPagesProducts: vi.fn(),
}));
vi.mock("../../perfect/group-pages/utils/getPerfectGroupPagesProducts.js", () => ({
  getPerfectGroupPagesProducts: vi.fn(),
}));
vi.mock("../../sharte/group-pages/utils/getSharteGroupPagesProducts.js", () => ({
  getSharteGroupPagesProducts: vi.fn(),
}));
vi.mock("../../yumi/group-pages/utils/getYumiGroupPagesProducts.js", () => ({
  getYumiGroupPagesProducts: vi.fn(),
}));
vi.mock("../../yumin/group-pages/utils/getYuminGroupPagesProducts.js", () => ({
  getYuminGroupPagesProducts: vi.fn(),
}));

import { getYumiGroupPagesProducts } from "../../yumi/group-pages/utils/getYumiGroupPagesProducts.js";
import { getAirGroupPagesProducts } from "../../air/group-pages/utils/getAirGroupPagesProducts.js";

const sampleRow = {
  title: "Product A",
  url: "https://example.com/p/1",
  imageUrl: "https://cdn.example/img.jpg",
  productId: "101",
};

describe("fetchGroupProductsByKonkName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches to yumi fetcher (case-insensitive)", async () => {
    vi.mocked(getYumiGroupPagesProducts).mockResolvedValue([sampleRow]);

    const result = await fetchGroupProductsByKonkName("YUMI", {
      groupUrl: "https://yumi.example/group",
      maxPages: 2,
    });

    expect(getYumiGroupPagesProducts).toHaveBeenCalledWith({
      groupUrl: "https://yumi.example/group",
      maxPages: 2,
    });
    expect(result).toEqual([sampleRow]);
  });

  it("dispatches to air fetcher", async () => {
    vi.mocked(getAirGroupPagesProducts).mockResolvedValue([sampleRow]);

    const result = await fetchGroupProductsByKonkName("air", {
      groupUrl: "https://air.example/group",
    });

    expect(getAirGroupPagesProducts).toHaveBeenCalledWith({
      groupUrl: "https://air.example/group",
    });
    expect(result).toEqual([sampleRow]);
  });

  it("throws UnsupportedKonkForGroupProductsError for unknown konk", async () => {
    await expect(
      fetchGroupProductsByKonkName("unknown-shop", {
        groupUrl: "https://example.com/group",
      })
    ).rejects.toThrow(UnsupportedKonkForGroupProductsError);

    await expect(
      fetchGroupProductsByKonkName("unknown-shop", {
        groupUrl: "https://example.com/group",
      })
    ).rejects.toThrow(/not implemented for konkName: unknown-shop/);
  });
});
