import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { toSkuStockBandDto } from "../toSkuStockBandDto.js";

describe("toSkuStockBandDto", () => {
  it("maps document fields including konk and image-free payload", () => {
    const createdAt = new Date("2026-11-01T00:00:00.000Z");
    const updatedAt = new Date("2026-11-02T00:00:00.000Z");
    const dto = toSkuStockBandDto({
      _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
      konk: { name: "balun", title: "BALUN (Івано-Франківськ)" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
      createdAt,
      updatedAt,
    });

    expect(dto).toEqual({
      _id: "507f1f77bcf86cd799439011",
      konk: { name: "balun", title: "BALUN (Івано-Франківськ)" },
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
      createdAt,
      updatedAt,
    });
  });
});
