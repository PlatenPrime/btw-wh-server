import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../../../models/Constant.js";
import { getConstantByNameUtil } from "../getConstantByNameUtil.js";

describe("getConstantByNameUtil", () => {
  beforeEach(async () => {
    await Constant.deleteMany({});
  });

  it("returns null when constant not found", async () => {
    const result = await getConstantByNameUtil("nonexistent");
    expect(result).toBeNull();
  });

  it("returns constant by name", async () => {
    const constant = await Constant.create({
      name: "acme",
      title: "Acme",
      data: { foo: "bar" },
    });
    const result = await getConstantByNameUtil("acme");
    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(constant._id.toString());
    expect(result?.name).toBe("acme");
    expect(result?.title).toBe("Acme");
    expect(result?.data).toEqual({ foo: "bar" });
  });
});
