import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { toSkugrDto, toSkugrWithoutSkusDto } from "../toSkugrDto.js";

describe("toSkugrDto", () => {
  const skuId1 = new mongoose.Types.ObjectId();
  const skuId2 = new mongoose.Types.ObjectId();
  const doc = {
    _id: new mongoose.Types.ObjectId(),
    konkName: "k1",
    prodName: "p1",
    title: "Group",
    url: "https://k1.com/g",
    isSliced: true,
    skus: [skuId1, skuId2],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-02-01"),
  };

  it("maps document to dto with string ids", () => {
    const dto = toSkugrDto(doc);
    expect(dto._id).toBe(doc._id.toString());
    expect(dto.konkName).toBe("k1");
    expect(dto.skus).toEqual([skuId1.toString(), skuId2.toString()]);
    expect(dto.isSliced).toBe(true);
  });

  it("toSkugrWithoutSkusDto omits skus array", () => {
    const dto = toSkugrWithoutSkusDto(doc);
    expect(dto.title).toBe("Group");
    expect(dto).not.toHaveProperty("skus");
    expect(dto._id).toBe(doc._id.toString());
  });
});
