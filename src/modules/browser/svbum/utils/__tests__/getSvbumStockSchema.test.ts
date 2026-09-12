import { describe, expect, it } from "vitest";
import { getSvbumStockSchema } from "../getSvbumStockSchema.js";

describe("getSvbumStockSchema", () => {
  it("принимает валидный URL", () => {
    const result = getSvbumStockSchema.safeParse({
      link: "https://sviatobum.ua/povitryani-kuli/item",
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет пустой и не-URL", () => {
    expect(getSvbumStockSchema.safeParse({ link: "" }).success).toBe(false);
    expect(getSvbumStockSchema.safeParse({ link: "not-a-url" }).success).toBe(
      false
    );
  });
});
