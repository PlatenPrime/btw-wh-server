import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { getAnalogsByProdUtil } from "../getAnalogsByProdUtil.js";

describe("getAnalogsByProdUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
  });

  it("returns analogs and pagination for given prodName", async () => {
    await Analog.create([
      { konkName: "k1", prodName: "maker", url: "https://a.com" },
      { konkName: "k2", prodName: "maker", url: "https://b.com" },
      { konkName: "k1", prodName: "other", url: "https://c.com" },
    ]);
    const result = await getAnalogsByProdUtil({
      prodName: "maker",
      page: 1,
      limit: 10,
    });
    expect(result.analogs).toHaveLength(2);
    expect(result.analogs.every((a) => a.prodName === "maker")).toBe(true);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("returns empty analogs and zero total when no match", async () => {
    const result = await getAnalogsByProdUtil({
      prodName: "nonexistent",
      page: 1,
      limit: 10,
    });
    expect(result.analogs).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it("filters by search when provided", async () => {
    await Analog.create([
      { konkName: "k", prodName: "maker", url: "https://a.com", title: "Match" },
      { konkName: "k", prodName: "maker", url: "https://b.com", nameukr: "Інше" },
    ]);
    const result = await getAnalogsByProdUtil({
      prodName: "maker",
      page: 1,
      limit: 10,
      search: "Match",
    });
    expect(result.analogs).toHaveLength(1);
    expect(result.analogs[0].title).toBe("Match");
  });

  it("returns analogs sorted by artikul", async () => {
    await Analog.create([
      { konkName: "k", prodName: "maker", url: "https://c.com", artikul: "C" },
      { konkName: "k", prodName: "maker", url: "https://a.com", artikul: "A" },
    ]);
    const result = await getAnalogsByProdUtil({
      prodName: "maker",
      page: 1,
      limit: 10,
    });
    expect(result.analogs.map((a) => a.artikul)).toEqual(["A", "C"]);
  });
});
