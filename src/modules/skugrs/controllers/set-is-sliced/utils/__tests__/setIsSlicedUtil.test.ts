import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../models/Skugr.js";
import { setIsSlicedUtil } from "../setIsSlicedUtil.js";

describe("setIsSlicedUtil", () => {
  beforeEach(async () => {
    await Skugr.deleteMany({});
  });

  it("sets isSliced=true only for documents without the field", async () => {
    await Skugr.collection.insertMany([
      {
        konkName: "k1",
        prodName: "p1",
        title: "Without field",
        url: "https://k.com/1",
        skus: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        konkName: "k1",
        prodName: "p1",
        title: "Already false",
        url: "https://k.com/2",
        skus: [],
        isSliced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await setIsSlicedUtil();

    expect(result.matchedCount).toBe(1);
    expect(result.modifiedCount).toBe(1);

    const docs = await Skugr.find().sort({ title: 1 }).lean();
    expect(docs[0]?.isSliced).toBe(false);
    expect(docs[1]?.isSliced).toBe(true);
  });
});
