import { describe, expect, it } from "vitest";
import { getPartymallStockSchema } from "../getPartymallStockSchema.js";

describe("getPartymallStockSchema", () => {
  it("принимает валидный URL", () => {
    const result = getPartymallStockSchema.safeParse({
      link: "https://partymall.ua/vozdushnyje-shary-pastjel-bjelyj-10-25-sm-gemar",
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет пустой и не-URL", () => {
    expect(getPartymallStockSchema.safeParse({ link: "" }).success).toBe(false);
    expect(getPartymallStockSchema.safeParse({ link: "not-a-url" }).success).toBe(false);
  });
});
