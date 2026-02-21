import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../../../models/Del.js";
import { Prod } from "../../../../../prods/models/Prod.js";
import { updateDelTitleByIdUtil } from "../updateDelTitleByIdUtil.js";

describe("updateDelTitleByIdUtil", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
    await Prod.deleteMany({});
    await Prod.create({
      name: "acme",
      title: "Acme",
      imageUrl: "https://example.com/acme.png",
    });
  });

  it("returns null when del not found", async () => {
    const result = await updateDelTitleByIdUtil({
      id: "000000000000000000000000",
      title: "New title",
      prodName: "acme",
    });
    expect(result).toBeNull();
  });

  it("updates title and prodName and returns updated document", async () => {
    const del = await Del.create({
      title: "Old title",
      prodName: "acme",
      artikuls: {},
    });
    const result = await updateDelTitleByIdUtil({
      id: del._id.toString(),
      title: "New title",
      prodName: "acme",
    });
    expect(result).not.toBeNull();
    expect("error" in (result ?? {})).toBe(false);
    expect((result as { title: string })?.title).toBe("New title");
    expect((result as { prodName: string })?.prodName).toBe("acme");
    expect((result as { prod?: { title: string; imageUrl: string } })?.prod).toMatchObject({
      title: "Acme",
      imageUrl: "https://example.com/acme.png",
    });
    const found = await Del.findById(del._id);
    expect(found?.title).toBe("New title");
    expect(found?.prodName).toBe("acme");
    expect(found?.prod).toMatchObject({
      title: "Acme",
      imageUrl: "https://example.com/acme.png",
    });
  });

  it("returns PROD_NOT_FOUND when prodName does not exist in Prod", async () => {
    const del = await Del.create({
      title: "Old title",
      prodName: "acme",
      prod: { title: "Acme", imageUrl: "https://example.com/acme.png" },
      artikuls: {},
    });
    const result = await updateDelTitleByIdUtil({
      id: del._id.toString(),
      title: "New title",
      prodName: "nonexistent",
    });
    expect("error" in (result ?? {})).toBe(true);
    if (result && "error" in result) {
      expect(result.error).toBe("PROD_NOT_FOUND");
    }
  });
});
