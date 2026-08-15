import { beforeEach, describe, expect, it } from "vitest";
import { GraboSku } from "../../../../models/GraboSku.js";
import { getGraboSkuByIdUtil } from "../getGraboSkuByIdUtil.js";

function graboSkuDoc(overrides: Record<string, unknown> = {}) {
  const productId = (overrides.productId as string) ?? "G00001";
  return {
    title: "Title",
    productId,
    url: `https://www.grabo-balloons.com/en/${productId.toLowerCase()}`,
    lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
    ...overrides,
  };
}

describe("getGraboSkuByIdUtil", () => {
  beforeEach(async () => {
    await GraboSku.deleteMany({});
  });

  it("returns null for a missing id", async () => {
    await expect(
      getGraboSkuByIdUtil("000000000000000000000000")
    ).resolves.toBeNull();
  });

  it("returns the document without __v", async () => {
    const saved = await GraboSku.create(
      graboSkuDoc({ productId: "G72274", title: "Pink Ribbon" })
    );

    const result = await getGraboSkuByIdUtil(saved._id.toString());
    expect(result).not.toBeNull();
    expect(result!._id.toString()).toBe(saved._id.toString());
    expect(result!.productId).toBe("G72274");
    expect(result!.title).toBe("Pink Ribbon");
    expect(result).not.toHaveProperty("__v");
  });
});
