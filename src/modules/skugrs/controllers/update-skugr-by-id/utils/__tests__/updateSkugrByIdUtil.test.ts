import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../models/Skugr.js";
import { updateSkugrByIdUtil } from "../updateSkugrByIdUtil.js";

describe("updateSkugrByIdUtil", () => {
  beforeEach(async () => {
    await Skugr.deleteMany({});
  });

  it("returns null when not found", async () => {
    const result = await updateSkugrByIdUtil({
      id: "507f1f77bcf86cd799439011",
      title: "X",
    });
    expect(result).toBeNull();
  });

  it("updates allowed fields only", async () => {
    const created = await Skugr.create({
      konkName: "k",
      prodName: "p",
      title: "Old",
      url: "https://k.com/old",
      skus: [],
    });

    const updated = await updateSkugrByIdUtil({
      id: created._id.toString(),
      title: "New",
      url: "https://k.com/new",
    });

    expect(updated?.title).toBe("New");
    expect(updated?.url).toBe("https://k.com/new");
    expect(updated?.konkName).toBe("k");
  });

  it("updates isSliced field", async () => {
    const created = await Skugr.create({
      konkName: "k",
      prodName: "p",
      title: "Old",
      url: "https://k.com/old-2",
      skus: [],
      isSliced: true,
    });

    const updated = await updateSkugrByIdUtil({
      id: created._id.toString(),
      isSliced: false,
    });

    expect(updated?.isSliced).toBe(false);
  });
});
