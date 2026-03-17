import { describe, expect, it } from "vitest";
import { Analog } from "../../../../../analogs/models/Analog.js";
import { Art } from "../../../../../arts/models/Art.js";
import { AnalogSlice } from "../../../../models/AnalogSlice.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { getKonkBtradeComparisonRangeUtil } from "../getKonkBtradeComparisonRangeUtil.js";

describe("getKonkBtradeComparisonRangeUtil", () => {
  it("returns ok: false when no analogs for konk/prod", async () => {
    const result = await getKonkBtradeComparisonRangeUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-31T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok: false when all analogs have empty artikul", async () => {
    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "",
      url: "https://example.com/analog-without-artikul",
    });

    const result = await getKonkBtradeComparisonRangeUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-31T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("returns comparison data for multiple analogs in date range", async () => {
    const artikul1 = "1102-0259";
    const artikul2 = "1102-0260";

    await Analog.insertMany([
      {
        konkName: "air",
        prodName: "gemar",
        artikul: artikul1,
        url: "https://example.com/analog-1",
      },
      {
        konkName: "air",
        prodName: "gemar",
        artikul: artikul2,
        url: "https://example.com/analog-2",
      },
    ]);

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const d3 = new Date("2026-03-03T00:00:00.000Z");

    await AnalogSlice.insertMany([
      {
        konkName: "air",
        date: d1,
        data: {
          [artikul1]: { stock: 0, price: 1.5 },
          [artikul2]: { stock: 5, price: 1.7 },
        },
      },
      {
        konkName: "air",
        date: d2,
        data: {
          [artikul1]: { stock: 1, price: 1.6 },
        },
      },
    ]);

    await BtradeSlice.insertMany([
      {
        date: d2,
        data: {
          [artikul1]: { quantity: 10, price: 2.0 },
        },
      },
      {
        date: d3,
        data: {
          [artikul2]: { quantity: 20, price: 2.2 },
        },
      },
    ]);

    const result = await getKonkBtradeComparisonRangeUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.analogs).toHaveLength(2);

    const analog1 = result.analogs.find((a) => a.artikul === artikul1)!;
    const analog2 = result.analogs.find((a) => a.artikul === artikul2)!;

    expect(analog1.items).toHaveLength(3);
    expect(analog2.items).toHaveLength(3);

    expect(analog1.items[0]).toMatchObject({
      analogStock: 0,
      analogPrice: 1.5,
      btradeStock: null,
      btradePrice: null,
    });
    expect(analog1.items[1]).toMatchObject({
      analogStock: 1,
      analogPrice: 1.6,
      btradeStock: 10,
      btradePrice: 2.0,
    });
    expect(analog1.items[2]).toMatchObject({
      analogStock: null,
      analogPrice: null,
      btradeStock: null,
      btradePrice: null,
    });

    expect(analog2.items[0]).toMatchObject({
      analogStock: 5,
      analogPrice: 1.7,
      btradeStock: null,
      btradePrice: null,
    });
    expect(analog2.items[1]).toMatchObject({
      analogStock: null,
      analogPrice: null,
      btradeStock: null,
      btradePrice: null,
    });
    expect(analog2.items[2]).toMatchObject({
      analogStock: null,
      analogPrice: null,
      btradeStock: 20,
      btradePrice: 2.2,
    });
  });

  it("filters by abc when abc param is passed", async () => {
    const artikulB = "ART-B-001";
    const artikulA = "ART-A-002";

    await Analog.insertMany([
      {
        konkName: "air",
        prodName: "gemar",
        artikul: artikulB,
        url: "https://example.com/art-b",
      },
      {
        konkName: "air",
        prodName: "gemar",
        artikul: artikulA,
        url: "https://example.com/art-a",
      },
    ]);

    await Art.insertMany([
      { artikul: artikulB, zone: "A1", abc: "101B" },
      { artikul: artikulA, zone: "A1", abc: "50A" },
    ]);

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    await AnalogSlice.create({
      konkName: "air",
      date: d1,
      data: {
        [artikulB]: { stock: 1, price: 1 },
        [artikulA]: { stock: 2, price: 2 },
      },
    });
    await BtradeSlice.create({
      date: d1,
      data: {
        [artikulB]: { quantity: 10, price: 1 },
        [artikulA]: { quantity: 20, price: 2 },
      },
    });

    const result = await getKonkBtradeComparisonRangeUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d1,
      abc: "B",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.analogs).toHaveLength(1);
    expect(result.analogs[0]!.artikul).toBe(artikulB);
    expect(result.analogs[0]!.artAbc).toBe("101B");
  });

  it("sorts by abc numeric part when abc and sortBy=abc are passed", async () => {
    const artikul101 = "ART-101";
    const artikul50 = "ART-50";

    await Analog.insertMany([
      {
        konkName: "air",
        prodName: "gemar",
        artikul: artikul101,
        url: "https://example.com/101",
      },
      {
        konkName: "air",
        prodName: "gemar",
        artikul: artikul50,
        url: "https://example.com/50",
      },
    ]);

    await Art.insertMany([
      { artikul: artikul101, zone: "A1", abc: "101B" },
      { artikul: artikul50, zone: "A1", abc: "50B" },
    ]);

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    await AnalogSlice.create({
      konkName: "air",
      date: d1,
      data: {
        [artikul101]: { stock: 1, price: 1 },
        [artikul50]: { stock: 2, price: 2 },
      },
    });
    await BtradeSlice.create({
      date: d1,
      data: {
        [artikul101]: { quantity: 10, price: 1 },
        [artikul50]: { quantity: 20, price: 2 },
      },
    });

    const result = await getKonkBtradeComparisonRangeUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d1,
      abc: "B",
      sortBy: "abc",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.analogs).toHaveLength(2);
    expect(result.analogs[0]!.artikul).toBe(artikul50);
    expect(result.analogs[0]!.artAbc).toBe("50B");
    expect(result.analogs[1]!.artikul).toBe(artikul101);
    expect(result.analogs[1]!.artAbc).toBe("101B");
  });

  it("sorts by abc letter then numeric when sortBy=abc without abc filter", async () => {
    const artikuls = [
      "art-34C",
      "art-56A",
      "art-2B",
      "art-278D",
      "art-12A",
      "art-87C",
      "art-42B",
      "art-123C",
      "art-7B",
      "art-4D",
    ] as const;
    const abcByArtikul: Record<string, string> = {
      "art-12A": "12A",
      "art-56A": "56A",
      "art-2B": "2B",
      "art-7B": "7B",
      "art-42B": "42B",
      "art-34C": "34C",
      "art-87C": "87C",
      "art-123C": "123C",
      "art-4D": "4D",
      "art-278D": "278D",
    };
    const expectedOrder = [
      "12A",
      "56A",
      "2B",
      "7B",
      "42B",
      "34C",
      "87C",
      "123C",
      "4D",
      "278D",
    ];

    await Analog.insertMany(
      artikuls.map((artikul) => ({
        konkName: "air",
        prodName: "gemar",
        artikul,
        url: `https://example.com/${artikul}`,
      })),
    );
    await Art.insertMany(
      artikuls.map((artikul) => ({
        artikul,
        zone: "A1",
        abc: abcByArtikul[artikul],
      })),
    );

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const data: Record<string, { stock: number; price: number }> = {};
    for (const artikul of artikuls) {
      data[artikul] = { stock: 1, price: 1 };
    }
    await AnalogSlice.create({ konkName: "air", date: d1, data });
    await BtradeSlice.create({
      date: d1,
      data: Object.fromEntries(artikuls.map((a) => [a, { quantity: 1, price: 1 }])),
    });

    const result = await getKonkBtradeComparisonRangeUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d1,
      sortBy: "abc",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.analogs).toHaveLength(expectedOrder.length);
    const actualOrder = result.analogs.map((a) => a.artAbc ?? "");
    expect(actualOrder).toEqual(expectedOrder);
  });

  it("returns ok: false when abc filter leaves no analogs", async () => {
    const artikulA = "ART-ONLY-A";

    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: artikulA,
      url: "https://example.com/a",
    });
    await Art.create({ artikul: artikulA, zone: "A1", abc: "50A" });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    await AnalogSlice.create({
      konkName: "air",
      date: d1,
      data: { [artikulA]: { stock: 1, price: 1 } },
    });

    const result = await getKonkBtradeComparisonRangeUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d1,
      abc: "B",
    });

    expect(result.ok).toBe(false);
  });
});

