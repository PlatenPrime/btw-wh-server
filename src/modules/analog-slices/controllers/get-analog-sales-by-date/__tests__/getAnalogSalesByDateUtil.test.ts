import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { getAnalogSalesByDateUtil } from "../utils/getAnalogSalesByDateUtil.js";

describe("getAnalogSalesByDateUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
    await AnalogSlice.deleteMany({});
  });

  it("returns null when analog not found", async () => {
    const result = await getAnalogSalesByDateUtil({
      analogId: "69a2de17f8a2a9cb9a8a75df",
      date: new Date("2026-03-01T00:00:00.000Z"),
    });
    expect(result).toBeNull();
  });

  it("returns null when analog has no artikul", async () => {
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "",
      url: "https://example.com/product-no-artikul",
    });
    const result = await getAnalogSalesByDateUtil({
      analogId: analog._id.toString(),
      date: new Date("2026-03-01T00:00:00.000Z"),
    });
    expect(result).toBeNull();
  });

  it("returns null when no slice for date", async () => {
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "1102-0259",
      url: "https://example.com/product-1",
    });
    const result = await getAnalogSalesByDateUtil({
      analogId: analog._id.toString(),
      date: new Date("2026-03-01T00:00:00.000Z"),
    });
    expect(result).toBeNull();
  });

  it("returns null when slice exists but no entry for artikul", async () => {
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "1102-0259",
      url: "https://example.com/product-2",
    });
    const date = new Date("2026-03-01T00:00:00.000Z");
    await AnalogSlice.create({
      konkName: "air",
      date,
      data: { "other-artikul": { stock: 1, price: 2 } },
    });
    const result = await getAnalogSalesByDateUtil({
      analogId: analog._id.toString(),
      date,
    });
    expect(result).toBeNull();
  });

  it("returns sales and revenue when both prev and curr slices exist", async () => {
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "1102-0259",
      url: "https://example.com/product-3",
    });
    const prevDate = new Date("2026-02-28T00:00:00.000Z");
    const currDate = new Date("2026-03-01T00:00:00.000Z");
    await AnalogSlice.insertMany([
      {
        konkName: "air",
        date: prevDate,
        data: { "1102-0259": { stock: 10, price: 1.5 } },
      },
      {
        konkName: "air",
        date: currDate,
        data: { "1102-0259": { stock: 7, price: 1.64 } },
      },
    ]);

    const result = await getAnalogSalesByDateUtil({
      analogId: analog._id.toString(),
      date: currDate,
    });

    expect(result).not.toBeNull();
    expect(result!.sales).toBe(3);
    expect(result!.revenue).toBe(4.92);
    expect(result!.price).toBe(1.64);
    expect(result!.isDeliveryDay).toBe(false);
  });

  it("returns sales 0 and isDeliveryDay false when no previous day slice", async () => {
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "1102-0259",
      url: "https://example.com/product-4",
    });
    const currDate = new Date("2026-03-01T00:00:00.000Z");
    await AnalogSlice.create({
      konkName: "air",
      date: currDate,
      data: { "1102-0259": { stock: 5, price: 2 } },
    });

    const result = await getAnalogSalesByDateUtil({
      analogId: analog._id.toString(),
      date: currDate,
    });

    expect(result).not.toBeNull();
    expect(result!.sales).toBe(0);
    expect(result!.revenue).toBe(0);
    expect(result!.price).toBe(2);
    expect(result!.isDeliveryDay).toBe(false);
  });

  it("returns sales 0 and isDeliveryDay true when stock increased", async () => {
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "1102-0259",
      url: "https://example.com/product-5",
    });
    const prevDate = new Date("2026-02-28T00:00:00.000Z");
    const currDate = new Date("2026-03-01T00:00:00.000Z");
    await AnalogSlice.insertMany([
      {
        konkName: "air",
        date: prevDate,
        data: { "1102-0259": { stock: 5, price: 1 } },
      },
      {
        konkName: "air",
        date: currDate,
        data: { "1102-0259": { stock: 10, price: 1.64 } },
      },
    ]);

    const result = await getAnalogSalesByDateUtil({
      analogId: analog._id.toString(),
      date: currDate,
    });

    expect(result).not.toBeNull();
    expect(result!.sales).toBe(0);
    expect(result!.revenue).toBe(0);
    expect(result!.price).toBe(1.64);
    expect(result!.isDeliveryDay).toBe(true);
  });
});
