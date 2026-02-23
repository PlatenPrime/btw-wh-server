import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../models/Konk.js";
import { deleteKonkByIdUtil } from "../deleteKonkByIdUtil.js";

describe("deleteKonkByIdUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("returns null when konk not found", async () => {
    const result = await deleteKonkByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("deletes konk and returns deleted document", async () => {
    const konk = await Konk.create({
      name: "to-delete",
      title: "To Delete",
      url: "https://x.com",
      imageUrl: "https://x.com/1.png",
    });
    const result = await deleteKonkByIdUtil(konk._id.toString());
    expect(result).toBeTruthy();
    expect(result?.name).toBe("to-delete");
    const found = await Konk.findById(konk._id);
    expect(found).toBeNull();
  });
});
