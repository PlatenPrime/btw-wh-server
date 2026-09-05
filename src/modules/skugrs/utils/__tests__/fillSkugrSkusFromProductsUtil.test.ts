import { describe, expect, it } from "vitest";
import { NEWSKU_PROD_NAME } from "../../../skus/constants/newskuProdName.js";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../models/Skugr.js";
import { fillSkugrSkusFromProductsUtil } from "../fillSkugrSkusFromProductsUtil.js";

describe("fillSkugrSkusFromProductsUtil", () => {
  it("returns empty stats when products array is empty", async () => {
    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Group",
      url: "https://yumi.example/group",
      skus: [],
    });

    const result = await fillSkugrSkusFromProductsUtil(skugr, []);
    expect(result).not.toBeNull();
    expect(result!.stats.fetched).toBe(0);
    expect(result!.stats.created).toBe(0);
    expect(await Sku.countDocuments()).toBe(0);
  });

  it("skips rows without productId", async () => {
    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "Group",
      url: "https://yumi.example/group",
      skus: [],
    });

    const result = await fillSkugrSkusFromProductsUtil(skugr, [
      {
        title: "No pid",
        url: "https://yumi.example/x",
        imageUrl: "https://cdn.example/x.jpg",
        productId: "  ",
      },
    ]);

    expect(result!.stats.skippedNoProductId).toBe(1);
    expect(result!.stats.created).toBe(0);
  });
});
