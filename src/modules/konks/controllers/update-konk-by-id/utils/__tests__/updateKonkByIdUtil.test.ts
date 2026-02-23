import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../models/Konk.js";
import { updateKonkByIdUtil } from "../updateKonkByIdUtil.js";

describe("updateKonkByIdUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("returns null when konk not found", async () => {
    const result = await updateKonkByIdUtil({
      id: "000000000000000000000000",
      title: "New",
    });
    expect(result).toBeNull();
  });

  it("updates only provided fields and returns updated document", async () => {
    const konk = await Konk.create({
      name: "old",
      title: "Old Title",
      url: "https://old.com",
      imageUrl: "https://old.com/1.png",
    });
    const result = await updateKonkByIdUtil({
      id: konk._id.toString(),
      title: "New Title",
    });
    expect(result?.title).toBe("New Title");
    expect(result?.name).toBe("old");
    expect(result?.url).toBe("https://old.com");
    expect(result?.imageUrl).toBe("https://old.com/1.png");
    const found = await Konk.findById(konk._id);
    expect(found?.title).toBe("New Title");
  });

  it("when no fields provided returns current document", async () => {
    const konk = await Konk.create({
      name: "x",
      title: "X",
      url: "https://x.com",
      imageUrl: "https://x.com/1.png",
    });
    const result = await updateKonkByIdUtil({ id: konk._id.toString() });
    expect(result?.name).toBe("x");
    expect(result?.title).toBe("X");
  });
});
