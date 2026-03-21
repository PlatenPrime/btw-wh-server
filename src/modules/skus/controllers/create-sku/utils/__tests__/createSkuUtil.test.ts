import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../models/Sku.js";
import { createSkuUtil } from "../createSkuUtil.js";

describe("createSkuUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
  });

  it("creates sku with all fields", async () => {
    const result = await createSkuUtil({
      konkName: "konk-a",
      prodName: "prod-a",
      btradeAnalog: "BT-001",
      title: "Sku A",
      url: "https://konk-a.com/sku-a",
    });

    expect(result._id).toBeDefined();
    expect(result.konkName).toBe("konk-a");
    expect(result.prodName).toBe("prod-a");
    expect(result.btradeAnalog).toBe("BT-001");
    expect(result.title).toBe("Sku A");
    expect(result.url).toBe("https://konk-a.com/sku-a");
    expect(result.imageUrl).toBe("");
  });

  it("persists imageUrl when provided", async () => {
    const result = await createSkuUtil({
      konkName: "konk-a",
      prodName: "prod-a",
      title: "Sku B",
      url: "https://konk-a.com/sku-b",
      imageUrl: "https://cdn.example/pic.jpg",
    });
    expect(result.imageUrl).toBe("https://cdn.example/pic.jpg");
  });
});
