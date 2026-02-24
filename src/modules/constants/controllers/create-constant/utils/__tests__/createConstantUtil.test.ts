import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../../../models/Constant.js";
import { createConstantUtil } from "../createConstantUtil.js";

describe("createConstantUtil", () => {
  beforeEach(async () => {
    await Constant.deleteMany({});
  });

  it("creates constant with all fields", async () => {
    const result = await createConstantUtil({
      name: "config",
      title: "Config",
      data: { foo: "bar" },
    });
    expect(result._id).toBeDefined();
    expect(result.name).toBe("config");
    expect(result.title).toBe("Config");
    expect(result.data).toEqual({ foo: "bar" });
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    const found = await Constant.findById(result._id);
    expect(found?.name).toBe("config");
  });

  it("creates constant with empty data", async () => {
    const result = await createConstantUtil({
      name: "empty",
      title: "Empty",
      data: {},
    });
    expect(result.data).toEqual({});
  });
});
