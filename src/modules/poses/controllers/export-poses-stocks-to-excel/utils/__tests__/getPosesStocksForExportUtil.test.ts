import { beforeEach, describe, expect, it } from "vitest";
import { createTestPos } from "../../../../../../test/setup.js";
import { Pos } from "../../../../models/Pos.js";
import { getPosesStocksForExportUtil } from "../getPosesStocksForExportUtil.js";

describe("getPosesStocksForExportUtil", () => {
  beforeEach(async () => {
    await Pos.deleteMany({});
  });

  it("returns only positions with quant > 0", async () => {
    await createTestPos({ artikul: "ART-1", quant: 5, sklad: "merezhi" });
    await createTestPos({ artikul: "ART-2", quant: 0, sklad: "merezhi" });

    const result = await getPosesStocksForExportUtil();

    expect(result).toHaveLength(1);
    expect(result[0].artikul).toBe("ART-1");
  });

  it("filters by sklad when provided", async () => {
    await createTestPos({ artikul: "ART-1", quant: 5, sklad: "merezhi" });
    await createTestPos({ artikul: "ART-2", quant: 3, sklad: "pogrebi" });

    const result = await getPosesStocksForExportUtil("pogrebi");

    expect(result).toHaveLength(1);
    expect(result[0].artikul).toBe("ART-2");
    expect(result[0].sklad).toBe("pogrebi");
  });

  it("selects only export fields", async () => {
    await createTestPos({
      artikul: "ART-1",
      nameukr: "Товар",
      quant: 7,
      sklad: "merezhi",
      boxes: 2,
    });

    const result = await getPosesStocksForExportUtil();

    expect(result[0]).toMatchObject({
      artikul: "ART-1",
      nameukr: "Товар",
      quant: 7,
      sklad: "merezhi",
    });
    expect(result[0]).not.toHaveProperty("boxes");
    expect(result[0]).not.toHaveProperty("palletTitle");
  });
});
