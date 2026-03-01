import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../analogs/models/Analog.js";
import { getUniqueArtikulsFromAnalogsUtil } from "../getUniqueArtikulsFromAnalogsUtil.js";

describe("getUniqueArtikulsFromAnalogsUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
  });

  it("returns unique non-empty artikuls from analogs", async () => {
    await Analog.create([
      { konkName: "k", prodName: "p", url: "https://a.com", artikul: "ART-1" },
      { konkName: "k", prodName: "p", url: "https://b.com", artikul: "ART-1" },
      { konkName: "k", prodName: "p", url: "https://c.com", artikul: "ART-2" },
      { konkName: "k", prodName: "p", url: "https://d.com", artikul: "" },
      { konkName: "k", prodName: "p", url: "https://e.com" },
    ]);

    const result = await getUniqueArtikulsFromAnalogsUtil();

    expect(result.sort()).toEqual(["ART-1", "ART-2"]);
  });

  it("returns empty array when no analogs or all have empty artikul", async () => {
    const result = await getUniqueArtikulsFromAnalogsUtil();
    expect(result).toEqual([]);
  });
});
