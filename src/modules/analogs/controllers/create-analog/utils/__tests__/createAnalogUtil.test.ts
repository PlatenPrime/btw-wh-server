import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { Analog } from "../../../../models/Analog.js";
import { createAnalogUtil } from "../createAnalogUtil.js";

describe("createAnalogUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
    await Art.deleteMany({});
  });

  it("creates analog with required fields and default artikul", async () => {
    const result = await createAnalogUtil({
      konkName: "acme",
      prodName: "maker",
      url: "https://example.com/page",
    });
    expect(result._id).toBeDefined();
    expect(result.konkName).toBe("acme");
    expect(result.prodName).toBe("maker");
    expect(result.url).toBe("https://example.com/page");
    expect(result.artikul).toBe("");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    const found = await Analog.findById(result._id);
    expect(found?.konkName).toBe("acme");
  });

  it("creates analog with artikul and pulls nameukr from Art", async () => {
    await Art.create({
      artikul: "ART-111",
      nameukr: "Назва з Art",
      zone: "A1",
    });
    const result = await createAnalogUtil({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
      artikul: "ART-111",
    });
    expect(result.artikul).toBe("ART-111");
    expect(result.nameukr).toBe("Назва з Art");
  });

  it("creates analog with artikul when Art has no nameukr", async () => {
    await Art.create({
      artikul: "ART-222",
      zone: "A1",
    });
    const result = await createAnalogUtil({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
      artikul: "ART-222",
    });
    expect(result.nameukr).toBeUndefined();
  });

  it("creates analog with title and imageUrl when no artikul", async () => {
    const result = await createAnalogUtil({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
      title: "Product title",
      imageUrl: "https://x.com/img.png",
    });
    expect(result.title).toBe("Product title");
    expect(result.imageUrl).toBe("https://x.com/img.png");
  });
});
