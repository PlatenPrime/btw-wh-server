import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../models/Prod.js";
import { getProdByNameUtil } from "../getProdByNameUtil.js";

describe("getProdByNameUtil", () => {
  beforeEach(async () => {
    await Prod.deleteMany({});
  });

  it("returns null when prod not found", async () => {
    const result = await getProdByNameUtil("nonexistent");
    expect(result).toBeNull();
  });

  it("returns prod by name", async () => {
    const prod = await Prod.create({
      name: "acme",
      title: "Acme Corp",
      imageUrl: "https://example.com/acme.png",
    });
    const result = await getProdByNameUtil("acme");
    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(prod._id.toString());
    expect(result?.name).toBe("acme");
    expect(result?.title).toBe("Acme Corp");
  });
});
