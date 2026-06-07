import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuSlice } from "../SkuSlice.js";

describe("SkuSlice Model", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
  });

  it("requires konkName and date", async () => {
    const missingKonk = new SkuSlice({ date: new Date("2026-06-01") });
    await expect(missingKonk.save()).rejects.toThrow();

    const missingDate = new SkuSlice({ konkName: "air" });
    await expect(missingDate.save()).rejects.toThrow();
  });

  it("saves slice with data map and defaults empty data", async () => {
    const withData = await SkuSlice.create({
      konkName: "air",
      date: new Date("2026-06-01T00:00:00.000Z"),
      data: { "air-1": { stock: 5, price: 10 } },
    });
    expect(withData.data["air-1"]).toEqual({ stock: 5, price: 10 });

    const emptyData = await SkuSlice.create({
      konkName: "sharik",
      date: new Date("2026-06-02T00:00:00.000Z"),
    });
    expect(emptyData.data).toEqual({});
  });

  it("enforces unique konkName+date index", async () => {
    const date = new Date("2026-06-03T00:00:00.000Z");
    await SkuSlice.create({ konkName: "dup-konk", date, data: {} });

    const duplicate = new SkuSlice({
      konkName: "dup-konk",
      date,
      data: { x: { stock: 1, price: 1 } },
    });
    await expect(duplicate.save()).rejects.toThrow();
  });
});
