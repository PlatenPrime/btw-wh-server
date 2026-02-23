import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../models/Konk.js";
import { createKonkUtil } from "../createKonkUtil.js";

describe("createKonkUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("creates konk with all fields", async () => {
    const result = await createKonkUtil({
      name: "acme",
      title: "Acme Corp",
      url: "https://example.com",
      imageUrl: "https://example.com/acme.png",
    });
    expect(result._id).toBeDefined();
    expect(result.name).toBe("acme");
    expect(result.title).toBe("Acme Corp");
    expect(result.url).toBe("https://example.com");
    expect(result.imageUrl).toBe("https://example.com/acme.png");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    const found = await Konk.findById(result._id);
    expect(found?.name).toBe("acme");
  });
});
