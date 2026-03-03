import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { Analog } from "../../../../models/Analog.js";
import { updateAnalogByIdUtil } from "../updateAnalogByIdUtil.js";

describe("updateAnalogByIdUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
    await Art.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await updateAnalogByIdUtil({
      id: "000000000000000000000000",
      url: "https://updated.com",
    });
    expect(result).toBeNull();
  });

  it("updates url and returns updated analog", async () => {
    const analog = await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://old.com",
    });
    const result = await updateAnalogByIdUtil({
      id: analog._id.toString(),
      url: "https://new.com",
    });
    expect(result?.url).toBe("https://new.com");
    const found = await Analog.findById(analog._id);
    expect(found?.url).toBe("https://new.com");
  });

  it("updates artikul and pulls nameukr from Art", async () => {
    await Art.create({
      artikul: "ART-UP",
      nameukr: "Назва з Art",
      zone: "A1",
    });
    const analog = await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
    });
    const result = await updateAnalogByIdUtil({
      id: analog._id.toString(),
      artikul: "ART-UP",
    });
    expect(result?.artikul).toBe("ART-UP");
    expect(result?.nameukr).toBe("Назва з Art");
  });

  it("returns same doc when no update fields (only id)", async () => {
    const analog = await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
    });
    const result = await updateAnalogByIdUtil({
      id: analog._id.toString(),
    });
    expect(result?._id.toString()).toBe(analog._id.toString());
  });
});
