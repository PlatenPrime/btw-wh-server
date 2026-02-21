import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../models/Prod.js";
import { createProdUtil } from "../createProdUtil.js";

describe("createProdUtil", () => {
  beforeEach(async () => {
    await Prod.deleteMany({});
  });

  it("creates prod with all fields", async () => {
    const result = await createProdUtil({
      name: "acme",
      title: "Acme Corp",
      imageUrl: "https://example.com/acme.png",
    });
    expect(result._id).toBeDefined();
    expect(result.name).toBe("acme");
    expect(result.title).toBe("Acme Corp");
    expect(result.imageUrl).toBe("https://example.com/acme.png");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    const found = await Prod.findById(result._id);
    expect(found?.name).toBe("acme");
  });
});
