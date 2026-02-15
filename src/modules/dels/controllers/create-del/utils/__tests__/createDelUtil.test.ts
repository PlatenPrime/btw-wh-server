import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../../../models/Del.js";
import { createDelUtil } from "../createDelUtil.js";

describe("createDelUtil", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
  });

  it("creates del with title and empty artikuls", async () => {
    const result = await createDelUtil({
      title: "New delivery",
      artikuls: {},
    });
    expect(result._id).toBeDefined();
    expect(result.title).toBe("New delivery");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    const found = await Del.findById(result._id);
    expect(found?.title).toBe("New delivery");
  });

  it("creates del with title and artikuls", async () => {
    const result = await createDelUtil({
      title: "With artikuls",
      artikuls: { "A1": 1, "A2": 2 },
    });
    const artikuls = (result.artikuls as Record<string, number>) ?? {};
    expect(artikuls["A1"]).toBe(1);
    expect(artikuls["A2"]).toBe(2);
  });
});
