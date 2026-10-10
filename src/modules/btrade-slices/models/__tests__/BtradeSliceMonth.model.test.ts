import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { BtradeSliceMonth } from "../BtradeSliceMonth.js";

describe("BtradeSliceMonth Model", () => {
  beforeEach(async () => {
    await BtradeSliceMonth.deleteMany({});
  });

  it("requires artikul and month", async () => {
    const missing = new BtradeSliceMonth({ artikul: "A-1" });
    await expect(missing.save()).rejects.toThrow();
  });

  it("persists days map", async () => {
    const month = new Date("2026-10-01T00:00:00.000Z");
    const saved = await BtradeSliceMonth.create({
      artikul: "ART-1",
      month,
      days: {
        "2026-10-09": { quantity: 10, price: 5 },
      },
    });
    const plain = saved.toObject();
    expect(plain.artikul).toBe("ART-1");
    expect(plain.days["2026-10-09"]).toEqual({ quantity: 10, price: 5 });
  });

  it("enforces unique (artikul, month)", async () => {
    const month = new Date("2026-10-01T00:00:00.000Z");
    await BtradeSliceMonth.create({ artikul: "dup", month, days: {} });
    await expect(
      BtradeSliceMonth.create({ artikul: "dup", month, days: {} }),
    ).rejects.toThrow();
  });
});
