import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../../../models/Kask.js";
import { getKaskUtil } from "../getKaskUtil.js";

describe("getKaskUtil", () => {
  beforeEach(async () => {
    await Kask.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await getKaskUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("returns full kask document by id", async () => {
    const kask = await Kask.create({
      artikul: "1234-5678",
      nameukr: "Тестовий товар",
      zone: "42-5-1",
      quant: 7,
      com: "Коментар",
    });

    const result = await getKaskUtil(String(kask._id));

    expect(result).toBeTruthy();
    expect(String(result?._id)).toBe(String(kask._id));
    expect(result?.artikul).toBe("1234-5678");
    expect(result?.nameukr).toBe("Тестовий товар");
    expect(result?.zone).toBe("42-5-1");
    expect(result?.quant).toBe(7);
    expect(result?.com).toBe("Коментар");
  });
});
