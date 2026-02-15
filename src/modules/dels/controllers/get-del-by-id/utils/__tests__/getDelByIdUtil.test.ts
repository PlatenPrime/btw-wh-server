import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../../../models/Del.js";
import { getDelByIdUtil } from "../getDelByIdUtil.js";

describe("getDelByIdUtil", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await getDelByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("returns full del document by id", async () => {
    const del = await Del.create({
      title: "Test Del",
      artikuls: { "ART-1": 5, "ART-2": 10 },
    });
    const result = await getDelByIdUtil(del._id.toString());
    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(del._id.toString());
    expect(result?.title).toBe("Test Del");
    const artikuls = (result?.artikuls as Record<string, number>) ?? {};
    expect(artikuls["ART-1"]).toBe(5);
    expect(artikuls["ART-2"]).toBe(10);
  });
});
