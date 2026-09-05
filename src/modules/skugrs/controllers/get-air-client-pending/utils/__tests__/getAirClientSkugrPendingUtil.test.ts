import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../models/Skugr.js";
import { getAirClientSkugrPendingUtil } from "../getAirClientSkugrPendingUtil.js";

describe("getAirClientSkugrPendingUtil", () => {
  beforeEach(async () => {
    await Skugr.deleteMany({});
  });

  it("returns only air groups with url", async () => {
    const air = await Skugr.create({
      konkName: "air",
      prodName: "p1",
      title: "Air A",
      url: "https://airballoons.com.ua/a",
      skus: [],
    });
    await Skugr.create({
      konkName: "AIR",
      prodName: "p2",
      title: "Air B",
      url: "https://airballoons.com.ua/b",
      skus: [],
    });
    await Skugr.create({
      konkName: "balun",
      prodName: "p3",
      title: "Other",
      url: "https://balun.example/g",
      skus: [],
    });

    const result = await getAirClientSkugrPendingUtil();
    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.title).sort()).toEqual([
      "Air A",
      "Air B",
    ]);
    expect(result.items.some((item) => item.skugrId === air._id.toString())).toBe(
      true
    );
  });

  it("skips air groups without url", async () => {
    const row = await Skugr.create({
      konkName: "air",
      prodName: "p",
      title: "Empty url",
      url: "https://airballoons.com.ua/x",
      skus: [],
    });
    await Skugr.updateOne({ _id: row._id }, { $set: { url: "   " } });
    const result = await getAirClientSkugrPendingUtil();
    expect(result.items).toEqual([]);
  });

  it("returns empty list when no air groups", async () => {
    await Skugr.create({
      konkName: "yumi",
      prodName: "p",
      title: "Y",
      url: "https://yumi.example/g",
      skus: [],
    });
    const result = await getAirClientSkugrPendingUtil();
    expect(result.items).toEqual([]);
  });
});
