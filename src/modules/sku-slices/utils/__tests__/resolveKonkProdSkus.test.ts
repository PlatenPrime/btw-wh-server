import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { Sku } from "../../../skus/models/Sku.js";
import { resolveKonkProdSkus } from "../resolveKonkProdSkus.js";

const KONK = "air";
const PROD = "gemar";

async function createSku(productId: string, prodName = PROD): Promise<Types.ObjectId> {
  const doc = await Sku.create({
    konkName: KONK,
    prodName,
    productId,
    title: `T-${productId}`,
    url: `https://e.com/${productId}`,
  });
  return doc._id;
}

async function createSkugr(
  title: string,
  skuIds: Types.ObjectId[],
  prodName = PROD,
): Promise<Types.ObjectId> {
  const doc = await Skugr.create({
    konkName: KONK,
    prodName,
    title,
    url: `https://e.com/skugr-${title}`,
    isSliced: true,
    skus: skuIds,
  });
  return doc._id;
}

describe("resolveKonkProdSkus", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("returns empty array when no SKU exists for konk/prod and no skugrIds", async () => {
    const rows = await resolveKonkProdSkus({ konk: KONK, prod: PROD });
    expect(rows).toEqual([]);
  });

  it("returns SKU sorted by productId without skugrIds; empty skugrTitle when no group covers SKU", async () => {
    await createSku("zzz");
    await createSku("aaa");

    const rows = await resolveKonkProdSkus({ konk: KONK, prod: PROD });
    expect(rows.map((r) => r.productId)).toEqual(["aaa", "zzz"]);
    expect(rows.every((r) => r.skugrTitle === "")).toBe(true);
    expect(rows.every((r) => r.skugrId === null)).toBe(true);
  });

  it("attaches first matching skugr (by _id) to SKU when no skugrIds passed", async () => {
    const a = await createSku("a");
    const b = await createSku("b");

    const skugr1 = await createSkugr("Group 1", [a]);
    const skugr2 = await createSkugr("Group 2", [a, b]);

    const rows = await resolveKonkProdSkus({ konk: KONK, prod: PROD });
    const aRow = rows.find((r) => r.productId === "a")!;
    const bRow = rows.find((r) => r.productId === "b")!;
    expect(aRow.skugrId).toBe(skugr1.toString());
    expect(aRow.skugrTitle).toBe("Group 1");
    expect(bRow.skugrId).toBe(skugr2.toString());
    expect(bRow.skugrTitle).toBe("Group 2");
  });

  it("with skugrIds returns SKUs grouped by passed order, dedup by productId — first wins", async () => {
    const a = await createSku("a");
    const b = await createSku("b");
    const c = await createSku("c");

    const g1 = await createSkugr("G1", [a, b]);
    const g2 = await createSkugr("G2", [b, c]);

    const rowsG1G2 = await resolveKonkProdSkus({
      konk: KONK,
      prod: PROD,
      skugrIds: [g1.toString(), g2.toString()],
    });
    expect(rowsG1G2.map((r) => r.productId)).toEqual(["a", "b", "c"]);
    expect(rowsG1G2.find((r) => r.productId === "b")!.skugrTitle).toBe("G1");

    const rowsG2G1 = await resolveKonkProdSkus({
      konk: KONK,
      prod: PROD,
      skugrIds: [g2.toString(), g1.toString()],
    });
    expect(rowsG2G1.map((r) => r.productId)).toEqual(["b", "c", "a"]);
    expect(rowsG2G1.find((r) => r.productId === "b")!.skugrTitle).toBe("G2");
  });

  it("filters out skugrs with mismatched konk/prod when skugrIds is set", async () => {
    const a = await createSku("a");
    const otherKonkSku = await Sku.create({
      konkName: "other",
      prodName: PROD,
      productId: "x",
      title: "x",
      url: "https://e.com/x",
    });

    const valid = await createSkugr("Valid", [a]);
    const wrongKonk = await Skugr.create({
      konkName: "other",
      prodName: PROD,
      title: "WrongKonk",
      url: "https://e.com/wk",
      isSliced: true,
      skus: [otherKonkSku._id],
    });

    const rows = await resolveKonkProdSkus({
      konk: KONK,
      prod: PROD,
      skugrIds: [wrongKonk._id.toString(), valid.toString()],
    });

    expect(rows.map((r) => r.productId)).toEqual(["a"]);
  });

  it("drops SKU with mismatched prodName inside a chosen skugr when prod is fixed", async () => {
    const a = await createSku("a", PROD);
    const otherProd = await createSku("o", "other-prod");

    const g = await Skugr.create({
      konkName: KONK,
      prodName: PROD,
      title: "Mixed",
      url: "https://e.com/g",
      isSliced: true,
      skus: [a, otherProd],
    });

    const rows = await resolveKonkProdSkus({
      konk: KONK,
      prod: PROD,
      skugrIds: [g._id.toString()],
    });
    expect(rows.map((r) => r.productId)).toEqual(["a"]);
  });

  it("with prod=undefined (pie) keeps SKU of any prodName", async () => {
    const a = await createSku("a", "p1");
    const b = await createSku("b", "p2");

    const g = await Skugr.create({
      konkName: KONK,
      prodName: "p1",
      title: "G",
      url: "https://e.com/g",
      isSliced: true,
      skus: [a, b],
    });

    const rows = await resolveKonkProdSkus({
      konk: KONK,
      skugrIds: [g._id.toString()],
    });
    expect(rows.map((r) => r.productId).sort()).toEqual(["a", "b"]);
  });

  it("returns empty array when all skugrIds miss konk/prod filter", async () => {
    const a = await createSku("a");
    const wrong = await Skugr.create({
      konkName: "other",
      prodName: PROD,
      title: "wrong",
      url: "https://e.com/w",
      isSliced: true,
      skus: [a],
    });

    const rows = await resolveKonkProdSkus({
      konk: KONK,
      prod: PROD,
      skugrIds: [wrong._id.toString()],
    });
    expect(rows).toEqual([]);
  });

  it("with prod=all returns SKUs of any prodName sorted by productId", async () => {
    await createSku("b", "prod-b");
    await createSku("a", "prod-a");

    const rows = await resolveKonkProdSkus({ konk: KONK, prod: "all" });
    expect(rows.map((r) => r.productId)).toEqual(["a", "b"]);
    expect(rows.map((r) => r.prodName).sort()).toEqual(["prod-a", "prod-b"]);
  });

  it("with prod=all and skugrIds includes SKUs from groups of different prodName", async () => {
    const a = await createSku("a", "p1");
    const b = await createSku("b", "p2");

    const g1 = await createSkugr("G1", [a], "p1");
    const g2 = await createSkugr("G2", [b], "p2");

    const rows = await resolveKonkProdSkus({
      konk: KONK,
      prod: "all",
      skugrIds: [g1.toString(), g2.toString()],
    });
    expect(rows.map((r) => r.productId)).toEqual(["a", "b"]);
    expect(rows.find((r) => r.productId === "a")!.prodName).toBe("p1");
    expect(rows.find((r) => r.productId === "b")!.prodName).toBe("p2");
  });
});
