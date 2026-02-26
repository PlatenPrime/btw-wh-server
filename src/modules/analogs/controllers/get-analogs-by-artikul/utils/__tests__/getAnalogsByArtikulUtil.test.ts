import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { getAnalogsByArtikulUtil } from "../getAnalogsByArtikulUtil.js";

describe("getAnalogsByArtikulUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
  });

  it("returns analogs for given artikul", async () => {
    await Analog.create([
      { konkName: "k1", prodName: "p", url: "https://a.com", artikul: "ART-1" },
      { konkName: "k2", prodName: "p", url: "https://b.com", artikul: "ART-1" },
      { konkName: "k1", prodName: "p", url: "https://c.com", artikul: "ART-2" },
    ]);
    const result = await getAnalogsByArtikulUtil("ART-1");
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.artikul === "ART-1")).toBe(true);
  });

  it("returns empty array when no analogs for artikul", async () => {
    const result = await getAnalogsByArtikulUtil("NONE");
    expect(result).toHaveLength(0);
  });
});
